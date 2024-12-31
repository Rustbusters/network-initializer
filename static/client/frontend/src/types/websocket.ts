export type UserId = number;

export interface User {
    id: number;
    name: string;
}

export type MessageContent =
    | { type: "Text"; data: string }
    | { type: "Image"; data: Uint8Array };

export interface MessageBody {
    sender_id: UserId;
    message: MessageContent;
    timestamp: string;
}

export type ServerToClientMessage =
    | { response: "RegistrationSuccess" }
    | { response: "RegistrationFailure" }
    | { response: "UnregisterSuccess" }
    | { response: "UnregisterFailure" }
    | { response: "ActiveUsersList"; users: User[] }
    | { response: "PrivateMessage"; sender_id: UserId; message: MessageBody; }
    | { response: "UserNotFound"; user_id: UserId };

export interface WebSocketMessage {
    client_id: number;
    server_id: number;
    message: ServerToClientMessage;
}
