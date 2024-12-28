import { get } from "svelte/store";
import { displayedChats } from "../stores/store";
import { initializeWebSocket } from "./ws";

// Inizializzazione tema
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

// Funzione di inizializzazione principale
export async function initialize() {
    initializeTheme();

    try {
        const response = await fetch('/api/threads');
        const threads = await response.json();
        threads.sort();

        threads.forEach((clientId: number) => {
			displayedChats.set(new Set([...get(displayedChats), clientId]));
        });
    } catch (error) {
        console.error('Error loading threads:', error);
    }

    // Inizializza WebSocket
    initializeWebSocket();
}
