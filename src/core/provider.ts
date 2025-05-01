import { Uri, Webview } from "vscode"
import * as vscode from "vscode";
import pWaitFor from "p-wait-for";

import { Message } from "./type/Message";
import { ReadCodeAssistant } from "./assistant";
import { AskResponse } from "./type/Response";

let codeReadingAssistant: ReadCodeAssistant;

export class ReadCodeAssistantProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "repilot.SidebarProvider"
  private view?: vscode.WebviewView | vscode.WebviewPanel;
  private gopls: string = "/opt/homebrew/bin/gopls";
  private disposables: vscode.Disposable[] = [];

  constructor(
    private readonly context: vscode.ExtensionContext,
  ) {}

	/*
	VSCode extensions use the disposable pattern to clean up resources when the sidebar/editor tab is closed by the user or system. This applies to event listening, commands, interacting with the UI, etc.
	- https://vscode-docs.readthedocs.io/en/stable/extensions/patterns-and-principles/
	- https://github.com/microsoft/vscode-extension-samples/blob/main/webview-sample/src/extension.ts
	*/
	async dispose() {
		if (this.view && "dispose" in this.view) {
			this.view.dispose()
		}
		while (this.disposables.length) {
			const x = this.disposables.pop()
			if (x) {
				x.dispose()
			}
		}
	}

  async resolveWebviewView(webviewView: vscode.WebviewView | vscode.WebviewPanel) {
    this.view = webviewView;
    webviewView.webview.options = {
        // Allow scripts in the webview
        enableScripts: true,
        localResourceRoots: [this.context.extensionUri],
    }
    webviewView.webview.html = this.getHtmlContent(webviewView.webview)

    this.gopls = await this.getGlobalState("goplsPath") as string ?? "/opt/homebrew/bin/gopls";
    this.setWebviewMessageListener(webviewView.webview);

		// Listen for when the panel becomes visible
		// https://github.com/microsoft/vscode-discussions/discussions/840
		if ("onDidChangeViewState" in webviewView) {
			// WebviewView and WebviewPanel have all the same properties except for this visibility listener
			// panel
			webviewView.onDidChangeViewState(
				() => {
					if (this.view?.visible) {
						this.view?.webview.postMessage({ type: "action", action: "didBecomeVisible" })
					}
				},
				null,
				this.disposables
			)
		} else if ("onDidChangeVisibility" in webviewView) {
			// sidebar
			webviewView.onDidChangeVisibility(
				() => {
					if (this.view?.visible) {
						this.view?.webview.postMessage({ type: "action", action: "didBecomeVisible" })
					}
				},
				null,
				this.disposables
			)
		}

		// Listen for when the view is disposed
		// This happens when the user closes the view or when the view is closed programmatically
		webviewView.onDidDispose(
			async () => {
				await this.dispose()
			},
			null,
			this.disposables
		)
  }

  async say(content: string): Promise<void> {
    const sayContentJson = JSON.stringify({
      type: "say",
      say: content,
    });
    this.view?.webview.postMessage(sayContentJson);
  }

  async ask(content: string): Promise<AskResponse> {
    codeReadingAssistant.clearWebViewAskResponse();
    const askContentJson = JSON.stringify({
      type: "ask",
      ask: content,
    });
    this.view?.webview.postMessage(askContentJson);
    await pWaitFor(
      () => {
        return !!codeReadingAssistant.getWebViewAskResponse();
      },
      { interval: 500 }
    );
    const response: AskResponse = {
      ask: codeReadingAssistant?.getWebViewAskResponse() ?? "unknown error",
    };
    console.log("response : ", response);
    return response;
  }

  sendState(messages: Message[]): void {
    const stateContentJson = JSON.stringify({
      type: "state",
      state: messages,
    });
    this.view?.webview.postMessage(stateContentJson);
  }

  async init() {
    codeReadingAssistant = new ReadCodeAssistant(
      this.ask,
      this.say,
      this.sendState,
      this.gopls,
      await this.getSecret("CluadeApiKey") || "key not set ..."
    );
  }

  private setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
        async (message) => {
        switch (message.type) {
          case "Init":
            const rootPath = message.rootPath ?? "";
            const rootFunctionName = message.rootFunctionName ?? "";
            const purpose = message.purpose ?? "";
            codeReadingAssistant.initializeAndRun(
              rootPath,
              rootFunctionName,
              purpose
            );
            break;
          case "Ask":
            const askResponse = message.askResponse;
            console.log("receive message", askResponse);
            codeReadingAssistant.handleWebViewAskResponse(askResponse);
            break;
          case "Reset":
            codeReadingAssistant = new ReadCodeAssistant(
              this.ask,
              this.say,
              this.sendState,
              this.gopls,
              await this.getSecret("CluadeApiKey") || "key not set ..."
            );
            break;
          default:
            break;
        }
    });
  }

  private getHtmlContent(webview: vscode.Webview): string {
    const stylesUri = getUri(webview, this.context.extensionUri, [
        "webview-ui",
        "repilot-webview",
        "dist",
        "assets",
        "main.css",
    ])
    // The JS file from the React build output
    const scriptUri = getUri(webview, this.context.extensionUri, ["webview-ui", "repilot-webview", "dist", "assets", "main.js"]);
    const nonce = getNonce();

//     <link rel="stylesheet" type="text/css" href="${stylesUri}">
// style-src ${webview.cspSource};
    return /*html*/ `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
    <meta name="theme-color" content="#000000">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}';">
    <title>Claude Dev</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
  </body>
</html>
`
  }

  postMessageToWebview(message: any) {
    this.view?.webview.postMessage(message);
  }

  private async getGlobalState(key: string) {
    return await this.context.globalState.get(key);
  }

  private async getSecret(key: string) {
    return process.env[key]
    // return await this.context.secrets.get(key);
  }
}

export function getNonce() {
	let text = ""
	const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length))
	}
	return text
}

export function getUri(webview: Webview, extensionUri: Uri, pathList: string[]) {
	return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList))
}
