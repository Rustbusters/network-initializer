import { writable } from 'svelte/store';

interface UserEvent {
    message: string;
    type: 'error' | 'success';
}

export const userEvents = writable<Record<number, UserEvent>>({});
