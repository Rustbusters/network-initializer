<script lang="ts">
    import { registrationStatus } from "../stores/store";
    import { connectionStatus } from "../utils/ws";
    import ChatContainer from "./ChatContainer.svelte";
    import ServerSelector from "./ServerSelector.svelte";

    interface Props {
        clientId: number;
    }

    let { clientId }: Props = $props();

    let destinationId = $state(-1);
</script>

<div
    class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-transform duration-200 hover:scale-[1.01] relative"
>
    <div class="p-4 border-b border-gray-300 dark:border-gray-700">
        <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
                <div class="relative">
                    <div
                        class="status-indicator w-3 h-3 {$connectionStatus
                            ? 'bg-green-500'
                            : 'bg-red-500'} rounded-full"
                    ></div>
                    <div
                        class="status-ping w-3 h-3 {$connectionStatus
                            ? 'bg-green-500 animate-ping'
                            : 'bg-red-500'} rounded-full absolute inset-0"
                    ></div>
                </div>
                <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    Chat {clientId}
                </h2>
            </div>
            <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                ID: {clientId}
            </span>
        </div>
    </div>
    {#if $registrationStatus[clientId]}
        <ChatContainer {clientId} bind:destinationId={destinationId} />
    {:else}
        <ServerSelector {clientId} />
    {/if}
</div>
