import { writable } from 'svelte/store';
import type { Message } from '../types/message';

// Variable to store the pair (user that is displaying the chat, the user that is being displayed)
// key: displayer|other
export const messages = writable<Record<string, Message[]>>({});

export function serializeKey(displayer: number, other: number) {
	return `${displayer}|${other}`;
}

export function deserializeKey(key: string) {
	const [displayer, other] = key.split('|').map(Number);
	return { displayer, other };
}

// Variable to store all the clients that are active
export const displayedChats = writable<Set<number>>(new Set());

// Variable to store the available users, registered to the same server
export const reachableUsers = writable<number[]>([1, 2, 3, 4, 5]);

// Variable to store the registration status of the user
// key: user_id, value: server_id (-1 if not registered)
export const registrationStatus = writable<Record<number, number>>({});

// Variable to store pending registrations
export const pendingRegistrations = writable<Set<number>>(new Set());

// Variable to store the disconnection status
export const isDisconnecting = writable<Record<number, boolean>>({});

// Variable to store pending unregistrations
export const pendingUnregistrations = writable<Set<number>>(new Set());