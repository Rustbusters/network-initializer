<script lang="ts">
    // Rimuovi l'import di ImageViewer
    import type { Message } from "../types/message";

    interface Props {
        message: Message;
        isReceived: boolean;
        onImageClick?: (src: string) => void;
    }

    let { message, isReceived, onImageClick }: Props = $props();
</script>

<div class="flex {isReceived ? 'justify-start' : 'justify-end'} animate-fadeIn">
    <div class="flex flex-col {message.content.type === 'Text' ? 'max-w-[70%]' : 'w-[60%]'} gap-0.5">
        {#if message.content.type === "Text"}
            <div 
                class="inline-block rounded-2xl px-4 py-2 {isReceived
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none'
                    : 'bg-blue-500 text-white rounded-br-none'} shadow-sm break-words whitespace-pre-wrap overflow-hidden"
            >
                {message.content.data}
            </div>
        {:else if message.content.type === "Image"}
            <div 
                class="p-1 rounded-xl {isReceived
                    ? 'bg-gray-100 dark:bg-gray-700 rounded-bl-none'
                    : 'bg-blue-500 rounded-br-none'} shadow-sm"
            >
                <img 
                    src={message.content.data}
                    alt="Sent img"
                    class="w-full h-auto rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    loading="lazy"
                    onclick={() => onImageClick?.(message.content.data)}
                />
            </div>
        {/if}
        <span class="text-xs text-gray-500 dark:text-gray-400 px-1 {isReceived ? 'text-left' : 'text-right'}">
            {message.timestamp}
        </span>
    </div>
</div>

<style>
/* Evita taglio di parole brevi e garantisci spezzatura del testo */
.inline-block {
    word-wrap: break-word;
    word-break: break-word;
}
</style>
