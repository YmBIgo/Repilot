// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ReadCodeAssistantProvider } from './core/provider';

let outputChannel: vscode.OutputChannel

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	outputChannel = vscode.window.createOutputChannel("repilot");
	context.subscriptions.push(outputChannel);

	outputChannel.appendLine("Repilot extension activated");

	// const sidebarProvider = new ReadCodeAssistantProvider(context);
	const tabProvider = new ReadCodeAssistantProvider(context);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(ReadCodeAssistantProvider.viewType, tabProvider, {
			webviewOptions: { retainContextWhenHidden: true },
		})
	);

	// context.subscriptions.push(
	// 	vscode.commands.registerCommand("repilot.plusButtonTapped", async () => {
	// 		outputChannel.appendLine("Plus button tapped")
	// 		await sidebarProvider.postMessageToWebview({ type: "action", action: "plusButtonTapped" })
	// 	})
	// );

	context.subscriptions.push(
		vscode.commands.registerCommand("repilot.settingsButtonTapped", () => {
			//const message = "claude-dev.settingsButtonTapped!"
			//vscode.window.showInformationMessage(message)
			tabProvider.postMessageToWebview({ type: "action", action: "settingsButtonTapped" })
		})
	);

	const openReadCodeAssistantInNewTab = () => {
		const lastCol = Math.max(...vscode.window.visibleTextEditors.map((editor) => editor.viewColumn || 0))
		const targetCol = Math.max(lastCol + 1, 1)
		const panel = vscode.window.createWebviewPanel(ReadCodeAssistantProvider.viewType, "repilot", targetCol, {
			enableScripts: true,
			retainContextWhenHidden: true,
			localResourceRoots: [context.extensionUri],
		});
		tabProvider.resolveWebviewView(panel);

		// Lock the editor group so clicking on files doesn't open them over the panel
		new Promise((resolve) => setTimeout(resolve, 100)).then(() => {
			vscode.commands.executeCommand("workbench.action.lockEditorGroup")
		});
	};

	context.subscriptions.push(vscode.commands.registerCommand("repilot.popoutButtonTapped", openReadCodeAssistantInNewTab))
	context.subscriptions.push(vscode.commands.registerCommand("repilot.openInNewTab", openReadCodeAssistantInNewTab))

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('repilot.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from repilot!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
