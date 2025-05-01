export type MessageType = "say" | "ask" | "user"
export type Message = {
    type: MessageType;
    content: string;
    time: number;
}