<script>
  import { onMount } from 'svelte';
  import Login from './components/Login.svelte';
  import Dashboard from './components/Dashboard.svelte';
  import SecurityResults from './components/SecurityResults.svelte';
  import Profile from './components/Profile.svelte';
  import { authStore, resultsStore, profileStore } from './stores';
  import vscode from './vscode.js';

  function showVSCodeMessage(message) {
    vscode.postMessage({
        type: 'showAlert',
        message
    });
}


  let currentView = 'login';
  let isLoading = false;

  onMount(() => {
    console.log('🚀 App mounted!');
    console.log('Current view:', currentView);
    // Listen for messages from extension
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  });

  function handleMessage(event) {
    const message = event.data;
    console.log('📩 Received message:', message); // Add this line

    switch (message.type) {
      case 'loginSuccess':
        console.log('✅ Login success, tokens:', message.tokens); // Add this
        authStore.set(message.tokens);
        currentView = 'dashboard';
        isLoading = false;
        break;
      case 'loginError':
        showVSCodeMessage(message.error);
        isLoading = false;
        break;
      case 'securityTestSuccess':
        resultsStore.set(message.results);
        currentView = 'results';
        isLoading = false;
        break;
      case 'securityTestError':
        showVSCodeMessage(message.error);
        isLoading = false;
        break;
      case 'profileSuccess':
        profileStore.set(message.profile);
        currentView = 'profile';
        isLoading = false;
        break;
      case 'profileError':
        showVSCodeMessage(message.error);
        isLoading = false;
        break;
      case 'fixSuccess':
      case 'fixAllSuccess':
        isLoading = false;
        break;
      case 'fixError':
        showVSCodeMessage(message.error);
        isLoading = false;
        break;
    }
  }

  function navigateTo(view) {
    currentView = view;
  }

  function setLoading(loading) {
    isLoading = loading;
  }
</script>

<main class="app">
  {#if isLoading}
    <div class="loading-overlay">
      <div class="spinner"></div>
      <p>Processing...</p>
    </div>
  {/if}

  {#if currentView === 'login'}
    <Login on:navigate={(e) => navigateTo(e.detail)} on:loading={(e) => setLoading(e.detail)} />
  {:else if currentView === 'dashboard'}
    <Dashboard on:navigate={(e) => navigateTo(e.detail)} on:loading={(e) => setLoading(e.detail)} />
  {:else if currentView === 'results'}
    <SecurityResults on:navigate={(e) => navigateTo(e.detail)} on:loading={(e) => setLoading(e.detail)} />
  {:else if currentView === 'profile'}
    <Profile on:navigate={(e) => navigateTo(e.detail)} on:loading={(e) => setLoading(e.detail)} />
  {/if}
</main>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background: var(--vscode-editor-background);
    color: var(--vscode-editor-foreground);
    overflow-x: hidden;
  }

  .app {
    width: 100%;
    min-height: 100vh;
    position: relative;
  }

  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: var(--vscode-button-background);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-overlay p {
    margin-top: 16px;
    color: #fff;
    font-size: 14px;
  }
</style>