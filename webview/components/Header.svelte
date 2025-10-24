<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let iconSrc = window.ICON_URI;

  function handleProfileClick() {
    dispatch('profileClick');
  }
</script>

<header class="header">
  <div class="logo">
    <img src={iconSrc} alt="VibeSec Logo" width="64" height="64" />
    <span class="brand">VibeSec</span>
  </div>

  <button class="profile-btn" on:click={handleProfileClick} aria-label="Profile">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2m8-10a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>
</header>

<style>
  .header {
    background: var(--vscode-sideBar-background);
    border-bottom: 1px solid var(--vscode-panel-border);
    padding: 14px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .brand {
    font-size: 16px;
    font-weight: 600;
    color: var(--vscode-editor-foreground);
  }

  .profile-btn {
    background: transparent;
    border: none;
    color: var(--vscode-editor-foreground);
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s ease;
  }

  .profile-btn:hover {
    background: var(--vscode-list-hoverBackground);
  }
</style>