import { writable } from 'svelte/store';
import type { User } from '../types/websocket';

interface UserListState {
    users: User[];
    isLoading: boolean;
    isRefreshing: boolean;
}

const clientUsers = writable<Record<number, UserListState>>({});

export function initializeClientUsers(clientId: number) {
    clientUsers.update(state => ({
        ...state,
        [clientId]: { users: [], isLoading: true, isRefreshing: false }
    }));
}

export function setUsers(clientId: number, users: User[]) {
    clientUsers.update(state => ({
        ...state,
        [clientId]: { ...state[clientId], users, isLoading: false, isRefreshing: false }
    }));
}

export function setRefreshing(clientId: number, isRefreshing: boolean) {
    clientUsers.update(state => ({
        ...state,
        [clientId]: { ...state[clientId], isRefreshing }
    }));
}

export { clientUsers };
