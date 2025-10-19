<script lang="ts">
  import { onMount } from 'svelte';

  let isDark = true;

  onMount(() => {
    // Detect VS Code theme
    const bodyClass = document.body.className;
    isDark = bodyClass.includes('vscode-dark') || bodyClass.includes('vscode-high-contrast');
    
    // Listen for theme changes
    const observer = new MutationObserver(() => {
      const bodyClass = document.body.className;
      isDark = bodyClass.includes('vscode-dark') || bodyClass.includes('vscode-high-contrast');
    });
    
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  });

  function toggleTheme() {
    // Note: This is informational only - VS Code controls the actual theme
    // In production, you could send a message to the extension to change the theme
    const vscode = (window as any).acquireVsCodeApi();
    vscode.postMessage({
      type: 'toggleTheme'
    });
  }
</script>

<button class="theme-toggle" on:click={toggleTheme} title="Toggle theme">
  {#if isDark}
    <span class="icon">☀️</span>
  {:else}
    <span class="icon">🌙</span>
  {/if}
</button>

<style>
  .theme-toggle {
    width: 36px;
    height: 36px;
    border: 1px solid var(--vscode-panel-border);
    background: var(--vscode-editor-background);
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .theme-toggle:hover {
    background: var(--vscode-list-hoverBackground);
    border-color: #1e40af;
  }

  .icon {
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: rotate(-90deg);
    }
    to {
      opacity: 1;
      transform: rotate(0);
    }
  }
</style>