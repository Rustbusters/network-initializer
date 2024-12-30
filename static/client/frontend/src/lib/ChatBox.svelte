<script lang="ts">
    import {CircleUserRound, Send} from "lucide-svelte";
    import {messages, serializeKey} from "../stores/store";
    import {sendMessage} from "../utils/chat";
    import EmojiButton from "./EmojiButton.svelte";
    import Message from "./Message.svelte";
    import {type Message as Msg} from "../types/message";
    import Toast from "./Toast.svelte";

    interface Props {
        clientId: number;
        destinationId: number;
    }

    let {clientId, destinationId}: Props = $props();

    let inputElement: HTMLInputElement | undefined = $state();
    let inputValue = $state("");

    // svelte-ignore non_reactive_update
    let chatBox: HTMLDivElement;
    let isAtBottom = true;

    let showToast = $state(false);
    let toastMessage = $state("");
    let toastId = $state(0);

    let chatMessages: Msg[] = $derived(
        $messages[serializeKey(clientId, destinationId)] || []
    );

    const scrollToBottom = () => {
        if (chatBox) {
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    };

    const checkScroll = () => {
        if (!chatBox) return;
        const threshold = 1;
        isAtBottom =
            Math.abs(
                chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight
            ) <= threshold;
    };

    $effect(() => {
        if ($messages[clientId] && chatBox && isAtBottom) {
            scrollToBottom();
        }
    });

    async function handleSend() {
        if (!inputValue.trim()) {
            return;
        }
        try {
            await sendMessage(clientId, destinationId, inputValue);
            inputValue = "";
            if (inputElement) {
                inputElement.value = "";
            }
            isAtBottom = true;
        } catch (error) {
            console.error(error);
            toastMessage = "Failed to send message. Please try again.";
            toastId++;
            showToast = true;
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    }

    function handleEmoji(emoji: string) {
        const cursorPos = inputElement?.selectionStart ?? inputValue.length;
        inputValue =
            inputValue.slice(0, cursorPos) +
            emoji +
            inputValue.slice(cursorPos);

        // Update cursor position after emoji insertion
        setTimeout(() => {
            if (inputElement) {
                const newPosition = cursorPos + emoji.length;
                inputElement.setSelectionRange(newPosition, newPosition);
                inputElement.focus();
            }
        }, 0);
    }
</script>

<div class="w-full h-[450px] flex flex-col">
    <!-- Aggiungi intestazione -->
    <div class="p-4 border-b border-gray-100 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <CircleUserRound class="size-5 text-gray-600 dark:text-gray-300"/>
            Client {destinationId}
        </h3>
    </div>

    <div
            bind:this={chatBox}
            onscroll={checkScroll}
            class="chat-box flex-1 overflow-y-auto space-y-4 p-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700"
    >
        {#each chatMessages as msg}
            <Message message={msg} isReceived={msg.sender_id !== clientId}/>
        {/each}
    </div>
    <div class="p-4 border-t border-gray-100 dark:border-gray-700">
        <div class="flex gap-2">
            <div class="relative flex-1">
                <input
                        type="text"
                        class="message-input w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                        placeholder="Write a message..."
                        bind:value={inputValue}
                        bind:this={inputElement}
                        onkeydown={handleKeydown}
                />
                <EmojiButton {inputElement} onEmojiSelect={handleEmoji}/>
            </div>
            <button
                    class="send-button p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 flex items-center justify-center"
                    onclick={handleSend}
            >
                <Send class="size-5"/>
            </button>
        </div>
    </div>
</div>

{#if showToast}
    <Toast
            message={toastMessage}
            type="error"
            onClose={() => (showToast = false)}
            key={toastId}
    />
{/if}
