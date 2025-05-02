export type MessageType = "say" | "ask" | "user" | "error"
export type Message = {
    type: MessageType;
    content: string;
    time: number;
}