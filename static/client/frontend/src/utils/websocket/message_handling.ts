import {get} from "svelte/store";
import {setUsers} from "../../stores/users";
import {
    displayedChats as activeUsers,
    isDisconnecting,
    messages,
    pendingRegistrations,
    pendingUnregistrations,
    registrationStatus,
    serializeKey,
} from "../../stores/store";
import type {ServerToClientMessage, WebSocketMessage,} from "../../types/websocket";

export function handleMessage(wsMessage: WebSocketMessage) {
    const message = wsMessage.message as ServerToClientMessage;
    switch (message.response) {
        case "RegistrationSuccess":
            registrationStatus.update((status) => ({
                ...status,
                [wsMessage.client_id]: wsMessage.server_id,
            }));
            pendingRegistrations.update((set) => {
                set.delete(wsMessage.client_id);
                return set;
            });
            break;

        case "RegistrationFailure":
            pendingRegistrations.update((set) => {
                set.delete(wsMessage.client_id);
                return set;
            });
            break;

        case "UnregisterSuccess":
            isDisconnecting.update(state => ({
                ...state,
                [wsMessage.client_id]: false
            }));
            registrationStatus.update((status) => {
                const {[wsMessage.client_id]: _, ...rest} = status;
                return rest;
            });
            pendingUnregistrations.update(set => {
                set.delete(wsMessage.client_id);
                return set;
            });
            break;

        case "UnregisterFailure":
            console.warn(`Failed to unregister client ${wsMessage.client_id}`);
            // In caso di errore, ripristiniamo lo stato di disconnessione
            isDisconnecting.update(state => ({
                ...state,
                [wsMessage.client_id]: false
            }));
            pendingUnregistrations.update(set => {
                set.delete(wsMessage.client_id);
                return set;
            });
            break;

        case "ActiveUsersList":
            setUsers(wsMessage.client_id, message.users);
            break;

        case "PrivateMessage":
            if (get(activeUsers).has(message.sender_id)) {
                const key = serializeKey(
                    wsMessage.client_id,
                    message.sender_id
                );
                messages.update((messages) => {
                    const newMessages = messages[key] || [];
                    return {
                        ...messages,
                        [key]: [
                            ...newMessages,
                            {
                                content: message.message.message,
                                timestamp: message.message.timestamp,
                                sender_id: message.sender_id,
                                receiver_id: wsMessage.client_id,
                                server_id: wsMessage.server_id,
                            },
                        ],
                    };
                });
            }
            break;

        case "UserNotFound":
            console.warn(`User ${message.user_id} not found`);
            break;
    }
}
