<script lang="ts">
  let count = 0;
  
  function increment() {
    count += 1;
  }
</script>

<div class="container">
  <h1>🛡️ VibeSec Extension</h1>
  <p>by Anuwa Labs</p>
  
  <div class="test-section">
    <h2>Extension is Working!</h2>
    <p>Click the button to test reactivity:</p>
    <button on:click={increment}>
      Clicked {count} times
    </button>
  </div>
  
  <div class="info">
    <p>✅ Webview loaded successfully</p>
    <p>✅ Svelte is working</p>
    <p>✅ TypeScript is compiling</p>
    <p>✅ Webpack bundle is loading</p>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: var(--vscode-font-family), sans-serif;
    background: var(--vscode-editor-background);
    color: var(--vscode-editor-foreground);
  }

  .container {
    padding: 2rem;
    max-width: 600px;
    margin: 0 auto;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    color: #3b82f6;
  }

  p {
    color: var(--vscode-descriptionForeground);
    margin: 0.5rem 0;
  }

  .test-section {
    margin: 2rem 0;
    padding: 1.5rem;
    background: var(--vscode-editor-inactiveSelectionBackground);
    border-radius: 0.5rem;
    border: 1px solid var(--vscode-panel-border);
  }

  .test-section h2 {
    margin-top: 0;
    color: var(--vscode-editor-foreground);
  }

  button {
    background: linear-gradient(135deg, #1e40af, #3b82f6);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
  }

  button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(30, 64, 175, 0.4);
  }

  button:active {
    transform: translateY(0);
  }

  .info {
    margin-top: 2rem;
    padding: 1rem;
    background: rgba(16, 185, 129, 0.1);
    border-left: 3px solid #10b981;
    border-radius: 0.25rem;
  }

  .info p {
    margin: 0.5rem 0;
    color: var(--vscode-editor-foreground);
  }
</style>

<div class="container">
  <h1>🛡️ VibeSec Extension</h1>
  <p>by Anuwa Labs</p>
  
  <div class="test-section">
    <h2>Extension is Working!</h2>
    <p>Click the button to test reactivity:</p>
    <button onclick={increment}>
      Clicked {count} times
    </button>
  </div>
  
  <div class="info">
    <p>✅ Webview loaded successfully</p>
    <p>✅ Svelte 5 is working</p>
    <p>✅ TypeScript is compiling</p>
    <p>✅ Webpack bundle is loading</p>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: var(--vscode-font-family), sans-serif;
    background: var(--vscode-editor-background);
    color: var(--vscode-editor-foreground);
  }

  .container {
    padding: 2rem;
    max-width: 600px;
    margin: 0 auto;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    color: #3b82f6;
  }

  p {
    color: var(--vscode-descriptionForeground);
    margin: 0.5rem 0;
  }

  .test-section {
    margin: 2rem 0;
    padding: 1.5rem;
    background: var(--vscode-editor-inactiveSelectionBackground);
    border-radius: 0.5rem;
    border: 1px solid var(--vscode-panel-border);
  }

  .test-section h2 {
    margin-top: 0;
    color: var(--vscode-editor-foreground);
  }

  button {
    background: linear-gradient(135deg, #1e40af, #3b82f6);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
  }

  button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(30, 64, 175, 0.4);
  }

  button:active {
    transform: translateY(0);
  }

  .info {
    margin-top: 2rem;
    padding: 1rem;
    background: rgba(16, 185, 129, 0.1);
    border-left: 3px solid #10b981;
    border-radius: 0.25rem;
  }

  .info p {
    margin: 0.5rem 0;
    color: var(--vscode-editor-foreground);
  }
</style>