// Elementi DOM
const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('message-input');
const themeToggle = document.getElementById('theme-toggle');

// Imposta il tema iniziale
function initializeTheme() {
    // Controlla se c'è una preferenza salvata
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

// Chiamata all'inizializzazione del tema
initializeTheme();

// WebSocket setup
const ws = new WebSocket('ws://localhost:7374');

ws.onopen = function () {
    console.log('WebSocket connection opened');
    appendSystemMessage('Connesso alla chat');
};

ws.onclose = function () {
    console.log('WebSocket connection closed');
    appendSystemMessage('Disconnesso dalla chat');
};

ws.onmessage = function (event) {
    const message = JSON.parse(event.data);
    appendMessage(message, 'received');
};

// Gestione tema scuro
themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Funzioni di utilità per i messaggi
function appendMessage(message, type = 'sent') {
    const messageDiv = document.createElement('div');
    const isReceived = type === 'received';

    messageDiv.className = `flex ${isReceived ? 'justify-start' : 'justify-end'} items-end gap-2 animate-fadeIn`;

    const timestamp = new Date(message.timestamp).toLocaleTimeString();

    messageDiv.innerHTML = `
        <div class="max-w-[70%] break-words">
            <div class="rounded-2xl px-4 py-2 ${
        isReceived
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none'
            : 'bg-blue-500 text-white rounded-br-none'
    }">
                ${escapeHTML(message.content)}
            </div>
            <span class="text-xs text-gray-500 dark:text-gray-400 mt-1 ${
        isReceived ? 'text-left' : 'text-right'
    } block">
                ${timestamp}
            </span>
        </div>
    `;

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function appendSystemMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'flex justify-center my-2 animate-fadeIn';
    messageDiv.innerHTML = `
        <span class="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
            ${text}
        </span>
    `;
    chatBox.appendChild(messageDiv);
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function sendMessage() {
    const content = messageInput.value.trim();
    if (!content)
        return;

    const message = {
        content: content,
        timestamp: new Date().toISOString()
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

        appendMessage(message, 'sent');
        messageInput.value = '';

    } catch (error) {
        console.error('Error sending message:', error);
        appendSystemMessage('Errore nell\'invio del messaggio');
    }
}

// Event listener per l'invio con Enter
messageInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage().catch(error => {
            console.error('Error sending message:', error);
            appendSystemMessage('Errore nell\'invio del messaggio');
        });
    }
});