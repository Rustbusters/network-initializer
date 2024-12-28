<script lang="ts">
    import { reachableUsers } from "../stores/store";
    import ChatBox from "./ChatBox.svelte";

    interface Props {
        clientId: number;
        destinationId: number;
    }

    let { clientId, destinationId = $bindable(-1) }: Props = $props();
</script>

<div class="flex w-full">
    <div
        class="w-52 bg-white dark:bg-gray-800 border-r border-gray-300 dark:border-gray-700 overflow-hidden"
    >
        <div class="px-3 py-2">
            <div class="space-y-2">
				<!-- TODO replace -->
                {#each $reachableUsers as id}
                    <div
                        class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                        <button 
                            class="text-gray-800 dark:text-gray-100" 
                            onclick={() => destinationId = id}
                        >
                            Client {id}
                        </button>
                    </div>
                {/each}
            </div>
        </div>
    </div>
    
    {#if destinationId != -1}
        <ChatBox {clientId} {destinationId} />
    {:else}
        <div class="flex items-center justify-center w-full h-[450px]">
            <p class="text-gray-500 dark:text-gray-400">
                Select a user to start chatting
            </p>
        </div>
    {/if}
</div>
