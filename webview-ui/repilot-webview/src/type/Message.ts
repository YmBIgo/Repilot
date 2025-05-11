export type MessageType = "say" | "ask" | "user" | "error" | "mermaid"

export type Message = {
    type: MessageType;
    content: string;
    time: number;
}