import { Anthropic } from "@anthropic-ai/sdk"
import fs from "fs/promises"

export class AnthropicHandler {
    private client: Anthropic
    private attemptCount: number
    private model: string
    private saveLlmHistoryFolder: string;
    constructor(apiKey: string, saveLlmHistoryFolder: string = "") {
        this.client = new Anthropic({apiKey})
        this.attemptCount = 0
        this.model = "claude-3-5-sonnet-20241022" // claude-3-7-sonnet-20250219 / claude-3-5-sonnet-20241022
        this.saveLlmHistoryFolder = saveLlmHistoryFolder
    }
    async createMessage(systemPrompt: string, history: Anthropic.MessageParam[]): Promise<Anthropic.Messages.Message> {
        console.log("create api request...")
        try {
            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 8192,
                system: systemPrompt,
                messages: history,
            })
            this.attemptCount = 0
            if (this.saveLlmHistoryFolder) {
                const fileName = `${Date.now()}.json`
                const folderPath = `${this.saveLlmHistoryFolder}/${fileName}`
                const content = JSON.stringify(response.content);
                await fs.writeFile(folderPath, content);
            }
            return response
        } catch (error) {
            console.error(error)
            this.attemptCount += 1
            if ( this.attemptCount > 3 ) throw new Error("fail to get api response")
            return this.createMessage(systemPrompt, history)
        }
    }
    getModel(): string {
        return this.model
    }
}