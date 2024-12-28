export interface Message {
    sender_id: number;
    receiver_id: number;
    content: string | Uint8Array;
    timestamp: string;
}