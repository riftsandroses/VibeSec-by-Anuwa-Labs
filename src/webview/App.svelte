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