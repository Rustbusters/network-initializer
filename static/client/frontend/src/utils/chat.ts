import { messages, serializeKey } from "../stores/store";
import type { Message } from "../types/message";

export async function sendMessage(
    senderId: number,
    receiverId: number,
    content: string | Uint8Array
) {
    if (!content) return;

    const message: Message = {
        content,
        timestamp: new Date().toLocaleDateString(),
        sender_id: senderId,
        receiver_id: receiverId,
    };

    try {
        const response = await fetch("/api/send-to", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            throw new Error("Network response was not ok");
        }

        let key: string = serializeKey(senderId, receiverId);
        messages.update((messages) => {
            const newMessages = messages[key] || [];
            return {
                ...messages,
                [key]: [...newMessages, message],
            };
        });

        return true;
    } catch (error) {
        console.error("Error sending message:", error);

        return false;
    }
}
