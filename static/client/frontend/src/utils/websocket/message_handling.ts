import {get} from "svelte/store";
import {setUsers} from "../../stores/users";
import {
    displayedChats as activeUsers,
    clientUsernames,
    isDisconnecting,
    messages,
    pendingRegistrations,
    pendingUnregistrations,
    registrationStatus,
    serializeKey,
    incrementUnread,
    currentChats,
    deserializeKey,
    unreadMessages
} from "../../stores/store";
import type {ServerToClientMessage, WebSocketMessage,} from "../../types/websocket";
import type { Message } from "../../types/message";

export function handleMessage(wsMessage: WebSocketMessage) {
    const message = wsMessage.message as ServerToClientMessage;
    switch (message.response) {
        case "RegistrationSuccess":
            // Update registration status and clean up pending registration
            if (get(pendingRegistrations).has(wsMessage.client_id)) {
                registrationStatus.update((status) => ({
                    ...status,
                    [wsMessage.client_id]: wsMessage.server_id,
                }));
                pendingRegistrations.update((set) => {
                    set.delete(wsMessage.client_id);
                    return set;
                });
            }
            break;

        case "RegistrationFailure":
            pendingRegistrations.update((set) => {
                set.delete(wsMessage.client_id);
                return set;
            });
            clientUsernames.update((usernames) => {
                const {[wsMessage.client_id]: _, ...rest} = usernames;
                return rest;
            });
            break;

        case "UnregisterSuccess":
            if (get(pendingUnregistrations).has(wsMessage.client_id)) {
                // Clear disconnection status
                isDisconnecting.update(state => ({
                    ...state,
                    [wsMessage.client_id]: false
                }));

                // Clear all data related to this client
                registrationStatus.update((status) => {
                    const {[wsMessage.client_id]: _, ...rest} = status;
                    return rest;
                });

                pendingUnregistrations.update(set => {
                    set.delete(wsMessage.client_id);
                    return set;
                });

                clientUsernames.update((usernames) => {
                    const {[wsMessage.client_id]: _, ...rest} = usernames;
                    return rest;
                });

                // Clear messages
                messages.update(messages => {
                    const newMessages: Record<string, Message[]> = {};
                    for (const key in messages) {
                        const {displayer} = deserializeKey(key);
                        if (displayer !== wsMessage.client_id) {
                            newMessages[key] = messages[key];
                        }
                    }
                    return newMessages;
                });

                // Clear unread messages
                unreadMessages.update(state => {
                    const {[wsMessage.client_id]: _, ...rest} = state;
                    return rest;
                });

                // Clear current chat
                currentChats.update(state => {
                    const {[wsMessage.client_id]: _, ...rest} = state;
                    return rest;
                });
            }
            break;

        case "UnregisterFailure":
            // Processiamo il fallimento solo se c'è una disconnessione pendente
            if (get(pendingUnregistrations).has(wsMessage.client_id)) {
                console.warn(`Failed to unregister client ${wsMessage.client_id}`);
                isDisconnecting.update(state => ({
                    ...state,
                    [wsMessage.client_id]: false
                }));
                pendingUnregistrations.update(set => {
                    set.delete(wsMessage.client_id);
                    return set;
                });
            }
            break;

        case "ActiveUsersList":
            setUsers(wsMessage.client_id, message.users);
            break;

        case "PrivateMessage":
            // Only process messages if the sender is in active users
            // Add message to the conversation history using a serialized key
            // TODO: Controllare bene questo controllo. Con il test_ws non funziona Bob con id 14
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
                                content: message.message.content,
                                timestamp: message.message.timestamp,
                                sender_id: message.sender_id,
                                receiver_id: wsMessage.client_id,
                                server_id: wsMessage.server_id,
                            },
                        ],
                    };
                });

                // Increment unread messages counter if not currently viewing this chat
                const currentChat = get(currentChats)[wsMessage.client_id];
                if (currentChat !== message.sender_id) {
                    incrementUnread(wsMessage.client_id, message.sender_id);
                }
            }
            break;

        case "UserNotFound":
            console.warn(`User ${message.user_id} not found`);
            break;
    }
}
