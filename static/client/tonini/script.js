let activeChats = new Map();
let ws = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

function createChatBox(clientId) {
    const chatContainer = document.createElement('div');
    chatContainer.className = 'bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-transform duration-200 hover:scale-[1.02]';

    chatContainer.innerHTML = `
        <div class="p-4 border-b border-gray-100 dark:border-gray-700">
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-2">
                    <div class="relative">
                        <div class="status-indicator w-3 h-3 bg-green-500 rounded-full"></div>
                        <div class="status-ping w-3 h-3 bg-green-500 rounded-full absolute inset-0 animate-ping"></div>
                    </div>
                    <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Chat ${clientId}</h2>
                </div>
                <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                    ID: ${clientId}
                </span>
            </div>
        </div>
        <div class="chat-box h-[350px] overflow-y-auto space-y-4 p-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
        </div>
        <div class="p-4 border-t border-gray-100 dark:border-gray-700">
            <div class="flex gap-2">
                <div class="relative flex-1">
                    <input
                        type="text"
                        class="message-input w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                        placeholder="Scrivi un messaggio..."
                    >
                    <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-400">
                        <button class="emoji-button hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200">
                            <i data-feather="smile" class="w-4 h-4"></i>
                        </button>
                        <div class="emoji-dropdown hidden absolute bottom-full right-0 mb-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 grid grid-cols-5 gap-2">
                            <button class="emoji-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200">😂</button>
                            <button class="emoji-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200">❤️</button>
                            <button class="emoji-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200">😍</button>
                            <button class="emoji-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200">🤣</button>
                            <button class="emoji-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200">😊</button>
                            <button class="emoji-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200">🙏</button>
                            <button class="emoji-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200">🥰</button>
                            <button class="emoji-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200">😭</button>
                            <button class="emoji-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200">😘</button>
                            <button class="emoji-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200">👍</button>
                            <button class="emoji-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200">🤔</button>
                            <button class="emoji-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200">😅</button>
                            <button class="emoji-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200">🎉</button>
                            <button class="emoji-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200">👏</button>
                            <button class="emoji-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200">🥳</button>
                            <button class="emoji-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200">🤗</button>
                            <button class="emoji-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200">😎</button>
                            <button class="emoji-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200">💔</button>
                            <button class="emoji-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200">💕</button>
                            <button class="emoji-option p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200">😜</button>
                        </div>
                    </div>
                </div>
                <button
                    class="send-button p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                    <i data-feather="send" class="w-5 h-5"></i>
                </button>
            </div>
        </div>
    `;

    const input = chatContainer.querySelector('.message-input');
    const sendButton = chatContainer.querySelector('.send-button');
    const chatBox = chatContainer.querySelector('.chat-box');
    const emojiButton = chatContainer.querySelector('.emoji-button');
    const emojiDropdown = chatContainer.querySelector('.emoji-dropdown');
    const emojiOptions = chatContainer.querySelectorAll('.emoji-option');

    // Add chat data to activeChats map
    activeChats.set(clientId, {
        container: chatContainer,
        chatBox: chatBox,
        input: input
    });

    // Emoji button click event listener
    emojiButton.addEventListener('click', (e) => {
        e.stopPropagation();
        emojiDropdown.classList.toggle('hidden');
    });

    // Emoji click event listener
    emojiOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const emoji = option.textContent;
            const cursorPos = input.selectionStart;
            const textBefore = input.value.substring(0, cursorPos);
            const textAfter = input.value.substring(cursorPos);
            input.value = textBefore + emoji + textAfter;
            input.focus();
            input.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
        });
    });

    // Detect outside click to close emoji dropdown
    document.addEventListener('click', () => {
        emojiDropdown.classList.add('hidden');
    });

    // Button click event listener
    sendButton.addEventListener('click', () => sendMessage(clientId));

    // Enter key press event listener
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage(clientId);
        }
    });

    return chatContainer;
}

function addChat(clientId) {
    if (activeChats.has(clientId)) {
        console.error('Chat già presente');
        return;
    }

    const gridContainer = document.getElementById('chat-grid');
    if (!gridContainer) {
        console.error('Container della griglia non trovato');
        return;
    }
    const chatBox = createChatBox(clientId);
    gridContainer.appendChild(chatBox);

    // Replace Feather icons after HTML injection
    feather.replace();
}

async function sendMessage(clientId) {
    const chatData = activeChats.get(clientId);
    const content = chatData.input.value.trim();
    if (!content) return;

    const message = {
        content: content,
        timestamp: new Date().toISOString(),
        client_id: clientId
    };

    try {
        const response = await fetch('/api/send-to', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(message)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        appendMessage(message, 'sent', clientId);
        chatData.input.value = '';

    } catch (error) {
        console.error('Error sending message:', error);
        appendSystemMessage('Errore nell\'invio del messaggio', clientId);
    }
}

function appendMessage(message, type, clientId) {
    const chatData = activeChats.get(clientId);
    const chatBox = chatData.chatBox;
    const isAtBottom = chatBox.scrollHeight - chatBox.scrollTop === chatBox.clientHeight;

    const messageDiv = document.createElement('div');
    const isReceived = type === 'received';

    messageDiv.className = `flex ${isReceived ? 'justify-start' : 'justify-end'} items-end gap-2 animate-fadeIn`;

    const timestamp = new Date(message.timestamp).toLocaleTimeString();

    messageDiv.innerHTML = `
        <div class="max-w-[80%] group">
            <div class="rounded-2xl px-4 py-2 ${
        isReceived
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none'
            : 'bg-blue-500 text-white rounded-br-none'
    } shadow-sm">
                ${escapeHTML(message.content)}
            </div>
            <div class="flex items-center ${isReceived ? 'justify-start' : 'justify-end'} gap-2 mt-1">
                <span class="text-xs text-gray-500 dark:text-gray-400">
                    ${timestamp}
                </span>
                ${isReceived ? `<span class="text-xs text-gray-400">ID: ${message.sender_id}</span>` : ''}
            </div>
        </div>
    `;

    chatBox.appendChild(messageDiv);

    // Scroll solo se l'utente è già in fondo
    if (isAtBottom) {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// Aggiorna la funzione appendSystemMessage per il nuovo stile
function appendSystemMessage(text, clientId) {
    const chatData = activeChats.get(clientId);
    const chatBox = chatData.chatBox;
    const isAtBottom = chatBox.scrollHeight - chatBox.scrollTop === chatBox.clientHeight;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex justify-center my-2 animate-fadeIn';
    messageDiv.innerHTML = `
    <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full shadow-sm">
        ${text}
    </span>
`;
    chatBox.appendChild(messageDiv);

    if (isAtBottom) {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Inizializzazione tema
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

function updateConnectionStatus(isOnline) {
    const indicators = document.getElementsByClassName('status-indicator');
    const pings = document.getElementsByClassName('status-ping');
    const statusText = document.getElementById('status-text');
    const reconnectButton = document.getElementById('reconnect-button');

    if (isOnline) {
        for (let indicator of indicators) {
            indicator.classList.remove('bg-red-500');
            indicator.classList.add('bg-green-500');
        }
        for (let ping of pings) {
            ping.classList.remove('bg-red-500');
            ping.classList.add('bg-green-500');
            ping.classList.add('animate-ping');
        }
        statusText.textContent = 'Online';
        reconnectButton.classList.add('hidden');
        reconnectAttempts = 0;
    } else {
        for (let indicator of indicators) {
            indicator.classList.remove('bg-green-500');
            indicator.classList.add('bg-red-500');
        }
        for (let ping of pings) {
            ping.classList.remove('bg-green-500');
            ping.classList.add('bg-red-500');
            ping.classList.remove('animate-ping');
        }
        statusText.textContent = 'Offline';
        reconnectButton.classList.remove('hidden');
    }
}

function attemptReconnect() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log('Numero massimo di tentativi di riconnessione raggiunto');
        return;
    }

    reconnectAttempts++;
    initializeWebSocket();
}

// Gestione WebSocket
function initializeWebSocket() {
    if (ws) {
        ws.close();
    }

    ws = new WebSocket('ws://localhost:7374');

    ws.onopen = function () {
        console.log('WebSocket connection opened');
        updateConnectionStatus(true);
        // Aggiungi un messaggio di sistema a tutte le chat
        activeChats.forEach((_, clientId) => {
            appendSystemMessage('Connesso dalla chat', clientId);
        });
    };

    ws.onclose = function () {
        console.log('WebSocket connection closed');
        updateConnectionStatus(false);

        // Aggiungi un messaggio di sistema a tutte le chat
        activeChats.forEach((_, clientId) => {
            appendSystemMessage('Disconnesso dalla chat', clientId);
        });
    };

    ws.onerror = function (error) {
        console.error('WebSocket error:', error);
        updateConnectionStatus(false);
    };

    ws.onmessage = function (event) {
        console.log('WebSocket message received:', event.data);

        const data = JSON.parse(event.data);

        console.log('WebSocket message received:', data);

        // Gestione nuovo thread
        if (data.type === 'new_thread') {
            addChat(data.thread_id);
            return;
        }

        // Gestione messaggio normale
        if (data.sender_id && activeChats.has(data.receiver_id)) {
            appendMessage(data, 'received', data.receiver_id);
        }
    };

    return ws;
}

// Funzione di inizializzazione principale
async function initialize() {
    initializeTheme();

    try {
        const response = await fetch('/api/threads');
        const threads = await response.json();

        threads.forEach(clientId => {
            addChat(clientId);
        });
    } catch (error) {
        console.error('Error loading threads:', error);
    }

    // Inizializza WebSocket
    initializeWebSocket();

    // Event listener per il tema
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });

    // Event listener per il pulsante di riconnessione
    const reconnectButton = document.getElementById('reconnect-button');
    reconnectButton.addEventListener('click', attemptReconnect);
}

// Avvia l'applicazione
document.addEventListener('DOMContentLoaded', initialize);