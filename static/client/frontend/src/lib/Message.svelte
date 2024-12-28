<script lang="ts">
    import type { Message } from "../types/message";

    interface Props {
        message: Message;
        isReceived: boolean;
    }

    let { message, isReceived }: Props = $props();
</script>

<div
    class="flex {isReceived
        ? 'justify-start'
        : 'justify-end'} items-end gap-2 animate-fadeIn"
>
    <div class="max-w-[80%] group">
        <div
            class="rounded-2xl px-4 py-2 {isReceived
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none'
                : 'bg-blue-500 text-white rounded-br-none'} shadow-sm break-words whitespace-pre-wrap overflow-hidden"
        >
            {message.content}
        </div>
        <div
            class="flex items-center {isReceived
                ? 'justify-start'
                : 'justify-end'} gap-2 mt-1"
        >
            <span class="text-xs text-gray-500 dark:text-gray-400">
                {message.timestamp}
            </span>
            {#if isReceived}
                <span class="text-xs text-gray-400"
                    >ID: {message.sender_id}</span
                >
            {/if}
        </div>
    </div>
</div>
