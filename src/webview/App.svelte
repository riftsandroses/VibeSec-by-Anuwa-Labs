<script lang="ts">
  import { onMount } from 'svelte';
  import Dashboard from './components/Dashboard.svelte';
  import Profile from './components/Profile.svelte';
  import Login from './components/Login.svelte';
  
  let currentView: 'dashboard' | 'profile' = $state('dashboard');
  let isAuthenticated = $state(false);
  let userData = $state<any>(null);
  let theme = $state<'dark' | 'light'>('dark');

  // @ts-ignore
  const vscode = acquireVsCodeApi();

  onMount(() => {
    // Request auth data on mount
    vscode.postMessage({ type: 'getAuth' });

    // Detect theme
    const isDark = document.body.classList.contains('vscode-dark') || 
                   document.body.classList.contains('vscode-high-contrast');
    theme = isDark ? 'dark' : 'light';

    // Listen for theme changes
    const observer = new MutationObserver(() => {
      const isDark = document.body.classList.contains('vscode-dark') || 
                     document.body.classList.contains('vscode-high-contrast');
      theme = isDark ? 'dark' : 'light';
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // Listen for messages from extension
    window.addEventListener('message', (event) => {
      const message = event.data;
      switch (message.type) {
        case 'authData':
          if (message.token && message.userData) {
            isAuthenticated = true;
            userData = message.userData;
          }
          break;
      }
    });

    return () => observer.disconnect();
  });

  function handleLogin(event: CustomEvent) {
    const { token, userData: user } = event.detail;
    vscode.postMessage({ type: 'saveAuth', token, userData: user });
    isAuthenticated = true;
    userData = user;
  }

  function handleLogout() {
    vscode.postMessage({ type: 'logout' });
    isAuthenticated = false;
    userData = null;
    currentView = 'dashboard';
  }

  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
  }
</script>

<div class="app" data-theme={theme}>
  {#if !isAuthenticated}
    <Login onlogin={handleLogin} {theme} />
  {:else}
    <div class="header">
      <div class="logo">
        <div class="shield-icon">🛡️</div>
        <h1>VibeSec</h1>
      </div>
      <div class="header-actions">
        <button 
          class="theme-toggle" 
          onclick={toggleTheme}
          title="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button 
          class="nav-btn {currentView === 'dashboard' ? 'active' : ''}" 
          onclick={() => currentView = 'dashboard'}
        >
          Dashboard
        </button>
        <button 
          class="nav-btn {currentView === 'profile' ? 'active' : ''}" 
          onclick={() => currentView = 'profile'}
        >
          Profile
        </button>
      </div>
    </div>

    <div class="content">
      {#if currentView === 'dashboard'}
        <Dashboard {userData} {theme} />
      {:else}
        <Profile {userData} onlogout={handleLogout} {theme} />
      {/if}
    </div>
  {/if}
</div>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family: var(--vscode-font-family);
    overflow-x: hidden;
  }

  .app {
    min-height: 100vh;
    background: var(--vscode-editor-background);
    color: var(--vscode-editor-foreground);
    transition: background 0.3s ease, color 0.3s ease;
  }

  .app[data-theme="dark"] {
    --primary: #1e40af;
    --primary-light: #3b82f6;
    --primary-dark: #1e3a8a;
    --bg: #0f172a;
    --bg-secondary: #1e293b;
    --text: #f1f5f9;
    --text-secondary: #94a3b8;
    --border: #334155;
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #ef4444;
  }

  .app[data-theme="light"] {
    --primary: #1e40af;
    --primary-light: #3b82f6;
    --primary-dark: #1e3a8a;
    --bg: #ffffff;
    --bg-secondary: #f8fafc;
    --text: #0f172a;
    --text-secondary: #475569;
    --border: #e2e8f0;
    --success: #10b981;
    --warning: #f59e0b;
    --danger: #ef4444;
  }

  .header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--bg-secondary);
    backdrop-filter: blur(10px);
    position: sticky;
    top: 0;
    z-index: 100;
    animation: slideDown 0.3s ease;
  }

  @keyframes slideDown {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .shield-icon {
    font-size: 1.5rem;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }

  h1 {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--primary-light);
  }

  .header-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .theme-toggle {
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 0.5rem;
    cursor: pointer;
    font-size: 1.2rem;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .theme-toggle:hover {
    background: var(--bg);
    transform: rotate(180deg);
  }

  .nav-btn {
    background: transparent;
    border: 1px solid transparent;
    color: var(--text-secondary);
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .nav-btn:hover {
    background: var(--bg);
    color: var(--text);
  }

  .nav-btn.active {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }

  .content {
    padding: 1.5rem;
    max-width: 100%;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 640px) {
    .header {
      flex-direction: column;
      gap: 1rem;
    }

    .header-actions {
      width: 100%;
      justify-content: space-between;
    }
  }
</style>