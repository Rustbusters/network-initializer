<script lang="ts">
    import {reachableUsers} from "../stores/store";
    import ChatBox from "./ChatBox.svelte";
    import {CircleUserRound} from "lucide-svelte";

    interface Props {
        clientId: number;
        destinationId: number;
    }

    let {clientId, destinationId = $bindable(-1)}: Props = $props();
</script>

<div class="flex w-full">
    <div
            class="w-52 bg-white dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 overflow-hidden"
    >
        <div class="px-3 py-2">
            <div class="space-y-2">
                {#each $reachableUsers as id}
                    <button
                            class="w-full p-2 rounded cursor-pointer transition-colors flex items-center gap-2
                               {destinationId === id 
                                   ? 'bg-blue-100 dark:bg-blue-900' 
                                   : 'hover:bg-gray-100 dark:hover:bg-gray-700'}"
                            onclick={() => destinationId = id}
                    >
                        <CircleUserRound class="size-5 {destinationId === id 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-600 dark:text-gray-300'}"/>
                        <span class="{destinationId === id 
                            ? 'text-blue-600 dark:text-blue-400 font-medium' 
                            : 'text-gray-800 dark:text-gray-100'}">
                            Client {id}
                        </span>
                    </button>
                {/each}
            </div>
        </div>
    </div>

    {#if destinationId !== -1}
        <ChatBox {clientId} {destinationId}/>
    {:else}
        <div class="flex items-center justify-center w-full h-[450px]">
            <p class="text-gray-500 dark:text-gray-400">
                Select a user to start chatting
            </p>
        </div>
    {/if}
</div>
