<script lang="ts">
  import { onMount } from 'svelte';
  import ThemeToggle from './components/ThemeToggle.svelte';
  import Dashboard from './components/Dashboard.svelte';
  import Profile from './components/Profile.svelte';

  // 🩵 FIX 1: allow currentView to be string type (not null-only)
  let currentView: 'dashboard' | 'profile' | null = 'dashboard';

  let isAuthenticated = false;

  let userData = {
    name: '',
    email: '',
    profilePicture: '',
    licenseStatus: 'Active',
    serverHealth: 'Healthy'
  };

  let scanData = {
    vulnerabilities: 0,
    frameworks: [] as string[],
    languages: [] as string[],
    lastScan: null as string | null
  };

  const vscode = (window as any).acquireVsCodeApi();

  onMount(() => {
    // Check for stored auth
    const state = vscode.getState();
    if (state?.isAuthenticated) {
      isAuthenticated = true;
      userData = state.userData;
      scanData = state.scanData || scanData;
    }

    // Listen for messages from extension
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  });

  function handleMessage(event: MessageEvent) {
    const message = event.data;
    
    switch (message.type) {
      case 'scanComplete':
        scanData = {
          vulnerabilities: message.data.vulnerabilities || 0,
          frameworks: message.data.frameworks || [],
          languages: message.data.languages || [],
          lastScan: new Date().toISOString()
        };
        saveState();
        break;
      case 'scanError':
        console.error('Scan error:', message.error);
        break;
      case 'logoutComplete':
        handleLogout();
        break;
    }
  }

  // 🩵 FIX 2 & 3: add proper type narrowing for FormData usage
  function handleLogin(emailInput: FormDataEntryValue | null, passwordInput: FormDataEntryValue | null) {
    if (typeof emailInput !== 'string' || typeof passwordInput !== 'string') {
      console.error('Invalid login data');
      return;
    }

    const email = emailInput;
    const password = passwordInput; // currently unused

    isAuthenticated = true;
    userData = {
      name: email.split('@')[0],
      email,
      profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=1e40af&color=fff`,
      licenseStatus: 'Active',
      serverHealth: 'Healthy'
    };
    currentView = 'dashboard';
    saveState();
  }

  function handleLogout() {
    isAuthenticated = false;
    userData = {
      name: '',
      email: '',
      profilePicture: '',
      licenseStatus: 'Active',
      serverHealth: 'Healthy'
    };
    scanData = {
      vulnerabilities: 0,
      frameworks: [],
      languages: [],
      lastScan: null
    };
    vscode.setState({});
  }

  function saveState() {
    vscode.setState({
      isAuthenticated,
      userData,
      scanData
    });
  }

  function switchView(view: 'dashboard' | 'profile') {
    currentView = view;
  }
</script>


<div class="app">
  {#if !isAuthenticated}
    <div class="login-container">
      <div class="login-header">
        <div class="logo">
          <div class="logo-icon">🛡️</div>
          <h1>VibeSec</h1>
        </div>
        <p class="subtitle">by Anuwa Labs</p>
      </div>
      
      <form on:submit|preventDefault={(e) => {
        const target = e.target;
        if (!(target instanceof HTMLFormElement)) return;
        const formData = new FormData(target);
        handleLogin(formData.get('email'), formData.get('password'));
      }} class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required placeholder="your@email.com" />
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required placeholder="••••••••" />
        </div>
        
        <button type="submit" class="btn-primary">Sign In</button>
      </form>
    </div>
  {:else}
    <div class="main-container">
      <header class="header">
        <div class="header-content">
          <div class="logo-small">
            <div class="logo-icon-small">🛡️</div>
            <span class="logo-text">VibeSec</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <nav class="nav-tabs">
        <button 
          class="nav-tab" 
          class:active={currentView === 'dashboard'}
          on:click={() => switchView('dashboard')}
        >
          Dashboard
        </button>
        <button 
          class="nav-tab" 
          class:active={currentView === 'profile'}
          on:click={() => switchView('profile')}
        >
          Profile
        </button>
      </nav>

      <main class="content">
        {#if currentView === 'dashboard'}
          <Dashboard {scanData} on:runScan />
        {:else}
          <Profile {userData} on:logout={() => {
            vscode.postMessage({ type: 'logout' });
          }} />
        {/if}
      </main>
    </div>
  {/if}
</div>

<style>
  .app {
    width: 100%;
    height: 100vh;
    overflow: hidden;
  }

  .login-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    padding: 2rem;
    animation: fadeIn 0.4s ease-out;
  }

  .login-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .logo-icon {
    font-size: 2.5rem;
    animation: pulse 2s ease-in-out infinite;
  }

  .logo h1 {
    font-size: 2rem;
    margin: 0;
    color: var(--vscode-foreground);
    font-weight: 700;
  }

  .subtitle {
    color: var(--vscode-descriptionForeground);
    margin: 0;
    font-size: 0.9rem;
  }

  .login-form {
    width: 100%;
    max-width: 320px;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--vscode-foreground);
  }

  .form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--vscode-input-border);
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border-radius: 6px;
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .form-group input:focus {
    outline: none;
    border-color: #1e40af;
    box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
  }

  .btn-primary {
    width: 100%;
    padding: 0.875rem;
    background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
  }

  .btn-primary:active {
    transform: translateY(0);
  }

  .main-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    animation: fadeIn 0.4s ease-out;
  }

  .header {
    border-bottom: 1px solid var(--vscode-panel-border);
    padding: 1rem;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo-small {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .logo-icon-small {
    font-size: 1.5rem;
  }

  .logo-text {
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--vscode-foreground);
  }

  .nav-tabs {
    display: flex;
    border-bottom: 1px solid var(--vscode-panel-border);
    padding: 0 1rem;
  }

  .nav-tab {
    padding: 0.75rem 1.5rem;
    background: none;
    border: none;
    color: var(--vscode-descriptionForeground);
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
  }

  .nav-tab:hover {
    color: var(--vscode-foreground);
  }

  .nav-tab.active {
    color: #1e40af;
    border-bottom-color: #1e40af;
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
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

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }
</style>