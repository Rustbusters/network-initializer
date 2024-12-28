<script lang="ts">
    import { onMount } from "svelte";
    import Toast from "./Toast.svelte";
    import { registrationStatus } from "../stores/store";

    interface Props {
        clientId: number;
    }
    let { clientId } = $props();

    let availableServers: number[] = $state([]);
    let showModal = $state(false);
    let selectedServer = $state(-1);
    let username = $state("");
    let showToast = $state(false);
    let toastMessage = $state("");
    let toastId = $state(0);
    
    // svelte-ignore non_reactive_update
    let usernameInput: HTMLInputElement;

    onMount(async () => {
        try {
            let response = await fetch("/api/servers");
            availableServers = await response.json();
            console.log(availableServers);
        } catch (e) {
            console.error(e);
            availableServers = [1, 2, 3];
        }
    });

    $effect(() => {
        if (showModal && usernameInput) {
            usernameInput.focus();
        }
    });

    async function handleRegistration() {
        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: selectedServer,
                    name: username
                })
            });

            if (response.ok) {
                showModal = false;
                username = "";
                // $registrationStatus[clientId] = selectedServer;
            } else {
                toastMessage = `Registration failed for Server ${selectedServer}. Please try again.`;
                toastId++;
                showToast = true;
            }
        } catch (error) {
            console.error(error);
            toastMessage = `Registration failed for Server ${selectedServer}. Please try again.`;
            toastId++;
            showToast = true;
        }
    }

    function closeModal() {
        showModal = false;
        username = "";
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === "Enter" && username.trim()) {
            event.preventDefault();
            handleRegistration();
        } else if (event.key === "Escape") {
            event.preventDefault();
            closeModal();
        }
    }

    function selectRandomServer() {
        if (availableServers.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableServers.length);
            selectedServer = availableServers[randomIndex];
            showModal = true;
        }
    }
</script>

<div class="flex w-full relative"> <!-- Aggiunto 'relative' qui -->
    <div class="flex items-center justify-center flex-col w-full h-[450px]">
        <p class="text-gray-500 dark:text-gray-400">
            Select a server to connect to:
        </p>
        <div class="flex space-y-2 mt-4 flex-col items-center">
            {#each availableServers as srv}
                <button
                    class="bg-gray-800 dark:bg-gray-700 text-white dark:text-gray-200 px-4 py-2 rounded-md"
                    onclick={() => {
                        selectedServer = srv;
                        showModal = true;
                    }}
                >
                    Server {srv}
                </button>
            {/each}
            <button
                class="bg-blue-600 dark:bg-blue-700 text-white dark:text-gray-200 px-4 py-2 rounded-md mt-4"
                onclick={selectRandomServer}
            >
                Random Server
            </button>
        </div>
    </div>

    {#if showModal}
        <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-[90%] w-[300px]">
                <h2 class="text-xl mb-4 text-gray-800 dark:text-gray-200">Enter your username</h2>
                <input
                    type="text"
                    bind:value={username}
                    bind:this={usernameInput}
                    placeholder="Username"
                    class="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:text-gray-200"
                    onkeydown={handleKeydown}
                />
                <div class="flex justify-end space-x-2">
                    <button
                        class="px-4 py-2 bg-gray-500 text-white rounded"
                        onclick={closeModal}
                    >
                        Cancel
                    </button>
                    <button
                        class="px-4 py-2 bg-blue-500 text-white rounded"
                        onclick={handleRegistration}
                        disabled={!username}
                    >
                        Join Server
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

{#if showToast}
    <Toast 
        message={toastMessage} 
        type="error" 
        onClose={() => showToast = false}
        key={toastId}
    />
{/if}
