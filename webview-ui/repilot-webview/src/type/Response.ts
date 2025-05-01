export type InitResponse = {
    type: "Init";
    rootPath: string;
    rootFunctionName: string;
    purpose: string;
}

export type AskResponse = {
    type: "Ask";
    askResponse: string;
}

export type Response = InitResponse | AskResponse;