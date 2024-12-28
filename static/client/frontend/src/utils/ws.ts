import { displayedChats as activeUsers, messages, serializeKey, registrationStatus } from "../stores/store";
import { get } from "svelte/store";
import { writable } from 'svelte/store';
import type { Message } from "../types/message";

let ws: WebSocket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export const connectionStatus = writable(false);

// Gestione WebSocket
export function initializeWebSocket() {
    if (ws) {
        ws.close();
    }

    ws = new WebSocket('ws://localhost:7374');

    ws.onopen = function () {
        console.log('WebSocket connection opened');
        updateConnectionStatus(true);
    };

    ws.onclose = function () {
        console.log('WebSocket connection closed');
        updateConnectionStatus(false);
    };

    ws.onerror = function (error) {
        console.error('WebSocket error:', error);
        updateConnectionStatus(false);
    };

    ws.onmessage = function (event) {
        console.log('WebSocket message received:', event.data);

        const data = JSON.parse(event.data.toString());

        console.log('WebSocket message received:', data);

        if (data.type === 'Registered') {
            registrationStatus.update(status => ({
                ...status,
                [data.client_id]: data.server_id
            }));
            return;
        }

        // Gestione nuovo thread
        if (data.type === 'new_thread') {
            activeUsers.update(chats => new Set([...chats, data.thread_id]));
            return;
        }

        // Gestione messaggio normale
        if (data.sender_id && get(activeUsers).has(data.receiver_id)) {
            let key: string = serializeKey(data.receiver_id, data.sender_id);
            messages.update(messages => {
                const newMessages = messages[key] || [];
                return {
                    ...messages,
                    [key]: [...newMessages, data as Message]
                };
            });
        }
    };

    return ws;
}

export function attemptReconnect() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log('Max reconnect attempts reached');
        return;
    }

    reconnectAttempts++;
    initializeWebSocket();
}

function updateConnectionStatus(status: boolean) {
    connectionStatus.set(status);
    reconnectAttempts = status ? 0 : reconnectAttempts;
}