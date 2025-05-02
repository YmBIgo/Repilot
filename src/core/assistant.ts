import { HistoryHandler, ProcessChoice } from "./history";
import { AnthropicHandler } from "./llm";
import fs from "fs/promises"
import { GoplsHandler, getFunctionContentFromFile } from "./lsp";
import Anthropic from "@anthropic-ai/sdk";
import { prompt, getReportPrompt } from "./prompt/index_ja";
import { Message, MessageType } from "./type/Message";
import { AskResponse } from "./type/Response";

export class ReadCodeAssistant {
    private apiHandler: AnthropicHandler;
    private historyHandler: HistoryHandler | null = null;
    private rootPath: string = "";
    private rootFunctionName: string = "";
    private purpose: string = "";
    private goplsPath: string = "";

    private saySocket: (content: string) => void;
    private askSocket: (content: string) => Promise<AskResponse>;
    private sendState: (messages: Message[]) => void;

    messages: Message[];
    private askResponse?: string;

    private saveReportFolder: string;

    constructor(
        ask: (content: string) => Promise<AskResponse>,
        say: (content: string) => void,
        sendState: (messages: Message[]) => void,
        goplsPath: string,
        apiKey: string,
        saveReportFolder: string,
    ) {
        this.apiHandler = new AnthropicHandler(apiKey);
        this.messages = [];
        this.saySocket = (content: string) => {
            const m = this.addMessages(content, "say");
            sendState(m);
            say(content);
        };
        this.askSocket = (content: string) => {
            const m = this.addMessages(content, "ask");
            sendState(m);
            return ask(content);
        };
        this.sendState = sendState;
        this.goplsPath = goplsPath;
        this.askResponse = undefined;
        this.saveReportFolder = saveReportFolder || "~/Desktop";
    }

    initializeAndRun(rootPath: string, rootFunctionName: string, purpose: string) {
        this.rootPath = rootPath;
        this.rootFunctionName = rootFunctionName;
        this.purpose = purpose;
        this.saySocket(`Starting Task...
EntryFile @${rootPath}
EntryFunction @${rootFunctionName}
-------`);
        this.historyHandler = new HistoryHandler(this.rootPath, this.rootFunctionName, this.rootFunctionName);
        this.run();
    }

    private run() {
        this.runInitialTask(this.rootPath, this.rootFunctionName)
    }

    private async runInitialTask(currentPath: string, currentFunctionLine: string) {
        let fileContent: string = "";
        try {
            fileContent = (await fs.readFile(currentPath)).toString();
        } catch(e) {
            console.error(e);
            return;
        }
        const fileContentArray = fileContent.split("\n");
        const startRow = fileContentArray.findIndex((fc) => fc.includes(currentFunctionLine));
        if (startRow === -1) return;
        const functionContent = await getFunctionContentFromFile(currentPath, startRow);
        if (!functionContent) return;
        this.runTask(currentPath, functionContent)
    }
    private async runTask(currentPath: string, functionContent: string) {
        const userPrompt = `
\`\`\`purpose
${this.purpose}
\`\`\`

\`\`\`code
${functionContent}
\`\`\`;
`
        this.saySocket("Creating API Request...")
        const history: Anthropic.MessageParam[] = [{role: "user", content: userPrompt}];
        const response = await this.apiHandler.createMessage(prompt, history)
        const type = response.content[0].type;
        if (type !== "text") return;
        let parsedContent;
        try {
            let rawMessage = response.content[0].text.replace(/\t/g, "");
            rawMessage = rawMessage.replace("```json", "").replace(/```^/g, "") // FIXME : 本来はつけたくないが、3.7にした瞬間必要になった...
            parsedContent = JSON.parse(rawMessage)
        } catch (e) {
            console.error(e, response.content[0].text)
            return
        }
        if (!Array.isArray(parsedContent)) return;
        const fileContentArray = functionContent.split("\n");
        let newHistoryChoices: ProcessChoice[] = [];
        let parsedContentCodeLineArray: string[] = [];
        let askQuestion = "";
        parsedContent.forEach((pc, index) => {
            const fileCodeLine = fileContentArray.find((fcr) => {
                // fcr.includes(pc.codeLine.split(")")[0]) にすべきかもしれないが、
                // definition の func 定義の場合、うまくいかない
                if (fcr.includes(pc.codeLine)) return true
                return false
            }) ?? fileContentArray.find((fcr) => {
                const spaceRemovedRow = fcr.replace(/ /g, "").replace(/\t/g, "");
                if (spaceRemovedRow.startsWith("//") || spaceRemovedRow.startsWith("/*")) return false
                // string check
                const isFunctionString = new RegExp(`"[\\s\\S]*${pc["function"]}[\\s\\S]*"`, "g").exec(fcr)
                if (isFunctionString) return false
                const isFunctionString2 = new RegExp(`'[\\s\\S]*${pc["function"]}[\\s\\S]*'`, "g").exec(fcr)
                if (isFunctionString2) return false
                const isFunctionString3 = new RegExp(`\`[\\s\\S]*${pc["function"]}[\\s\\S]*\``, "g").exec(fcr)
                if (isFunctionString3) return false
                const isFunctionNameInclude = new RegExp(`[ .\t]{1}${pc["function"]}[ (.:,]{1}`).exec(fcr);
                return Boolean(isFunctionNameInclude);
                // return fcr.includes(` ${pc["function"]}`) || fcr.includes(`.${pc["function"]}`);
            }) ?? (pc.codeLine.includes(pc["function"])
            ? pc.codeLine
            : fileContentArray.find((fcr) => {
                const spaceRemovedRow = fcr.replace(/ /g, "").replace(/\t/g, "");
                if (spaceRemovedRow.startsWith("//") || spaceRemovedRow.startsWith("/*")) return false;
                return fcr.includes(pc["function"])
            }) ?? pc["function"]);
            parsedContentCodeLineArray.push(fileCodeLine)
            askQuestion += `${index} : ${pc["function"]}\n`;
            askQuestion += `Details : ${pc.explain}\n`;
            askQuestion += `Whole CodeLine : ${fileCodeLine}\n`;
            askQuestion += `Original Code : ${pc.codeLine}\n`;
            askQuestion += `Confidence: ${pc.confidence}\n`;
            askQuestion += "-----------------\n";
            newHistoryChoices.push({
                functionName: pc["function"],
                functionCodeLine: fileCodeLine,
                originalFilePath: currentPath,
            } as ProcessChoice);
        })
        let resultNumber = 0;
        this.saySocket(`${askQuestion}`)
        for(;;) {
            const result = await this.askSocket(`Please Input Index which you want to see details
※：enter 5 to retry. enter 6 to show history. enter 7 to get report. enter 8 to show current file.
※：If you enter string, it is recognized as hash value to search history.
`);
            console.log("result : ", result)
            resultNumber = Number(result.ask);
            const newMessages = this.addMessages(`User Enter ${result.ask}`, "user")
            this.sendState(newMessages)
            if (isNaN(resultNumber)) {
                this.runHistoryPoint(result.ask);
                return;
            }
            if (resultNumber >= 0 && resultNumber < 5) {
                break;
            }
            if (resultNumber === 5) {
                this.runTask(currentPath, functionContent)
                return
            }
            if (resultNumber === 6) {
                const historyTree = this.historyHandler?.showHistory();
                if (historyTree) this.saySocket(historyTree);
                continue;
            }
            if (resultNumber === 7) {
                await this.getReport();
                continue;
            }
            if (resultNumber === 8) {
                this.saySocket("\n\n----------\n" + functionContent + "\n----------\n\n");
                continue;
            }
        }
        if (!parsedContent[resultNumber]) return;
        this.historyHandler?.addHistory(newHistoryChoices);
        this.saySocket(`Gopls is Searching for "${parsedContent[resultNumber]["function"]}"\n`)
        const goplsHanlder = new GoplsHandler(currentPath, this.goplsPath);
        await goplsHanlder.readFile();
        const file = await goplsHanlder.searchNextFunction(
            parsedContentCodeLineArray[resultNumber],
            parsedContent[resultNumber]["function"]
        )
        if (!file) {
            console.warn("gopls file not found...")
            return
        }
        const [newFilePath, newFileContent] = file
        this.historyHandler?.choose(resultNumber, newFileContent)
        this.saySocket(`Searching for @${newFilePath}\n`)
        this.runTask(newFilePath, newFileContent)
    }
    private runHistoryPoint(historyHash: string) {
        const newRunConfig = this.historyHandler?.moveById(historyHash);
        if (!newRunConfig) return;
        const { functionCodeLine, originalFilePath } = newRunConfig;
        this.runInitialTask(originalFilePath, functionCodeLine);
    }
    private async getReport() {
        const r = this.historyHandler?.traceFunctionContent()
        if (!r) return;
        const [result, functionResult] = r;
        this.saySocket(`Generate Report related to "${functionResult}"`);
        const userPrompt = `\`\`\`purpose
${this.purpose}
\`\`\`

${result}`;
        const history: Anthropic.MessageParam[] = [{role: "user", content: userPrompt}];
        const response = await this.apiHandler.createMessage(getReportPrompt, history);
        const type = response.content[0].type;
        if (type !== "text") return;
        const res = response.content[0].text + "\n\n - Details \n\n" + result;
        const fileName = `report_${Date.now()}.txt`;
        await fs.writeFile(`${this.saveReportFolder}/${fileName}`, res);
        this.saySocket(`Generate Report successfully @${this.saveReportFolder}/${fileName}`);
    }

    handleWebViewAskResponse(askResponse: string) {
        this.askResponse = askResponse;
    }
    getWebViewAskResponse(): string | undefined {
        return this.askResponse;
    }
    clearWebViewAskResponse() {
        this.askResponse = undefined;
    }
    getMessages() {
        return this.messages;
    }
    addMessages(content: string, type: MessageType) {
        this.messages.push({ type, content, time: Date.now() });
        return this.messages;
    }
    setMessages(messages: Message[]) {
        this.messages = messages;
    }
}