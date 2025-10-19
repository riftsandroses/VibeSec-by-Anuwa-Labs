<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let scanData: {
    vulnerabilities: number;
    frameworks: string[];
    languages: string[];
    lastScan: string | null;
  };

  const dispatch = createEventDispatcher();
  let isScanning = false;

  function runScan() {
    isScanning = true;
    const vscode = (window as any).acquireVsCodeApi();
    vscode.postMessage({
      type: 'runScan',
      apiUrl: 'https://api.example.com/scan', // Replace with actual API
      authToken: 'your-auth-token' // Replace with actual token management
    });

    // Simulate scan completion (remove in production)
    setTimeout(() => {
      isScanning = false;
    }, 3000);
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  function getVulnerabilityColor(count: number) {
    if (count === 0) return '#10b981';
    if (count < 5) return '#f59e0b';
    return '#ef4444';
  }
</script>

<div class="dashboard">
  <div class="scan-section">
    <h2>Security Analysis</h2>
    <button 
      class="scan-button" 
      class:scanning={isScanning}
      on:click={runScan}
      disabled={isScanning}
    >
      {#if isScanning}
        <span class="spinner"></span>
        Analyzing Workspace...
      {:else}
        <span class="icon">🔍</span>
        Initiate Security Scan
      {/if}
    </button>
    
    {#if scanData.lastScan}
      <p class="last-scan">Last scan: {formatDate(scanData.lastScan)}</p>
    {/if}
  </div>

  <div class="insights-grid">
    <div class="insight-card vulnerabilities">
      <div class="card-header">
        <span class="card-icon">⚠️</span>
        <h3>Vulnerabilities</h3>
      </div>
      <div 
        class="card-value" 
        style="color: {getVulnerabilityColor(scanData.vulnerabilities)}"
      >
        {scanData.vulnerabilities}
      </div>
      <div class="card-footer">
        {#if scanData.vulnerabilities === 0}
          <span class="status-badge success">Secure</span>
        {:else if scanData.vulnerabilities < 5}
          <span class="status-badge warning">Review Required</span>
        {:else}
          <span class="status-badge critical">Action Needed</span>
        {/if}
      </div>
    </div>

    <div class="insight-card frameworks">
      <div class="card-header">
        <span class="card-icon">🔧</span>
        <h3>Frameworks</h3>
      </div>
      <div class="card-content">
        {#if scanData.frameworks.length > 0}
          <div class="tag-list">
            {#each scanData.frameworks as framework}
              <span class="tag">{framework}</span>
            {/each}
          </div>
        {:else}
          <p class="empty-state">Run a scan to detect frameworks</p>
        {/if}
      </div>
    </div>

    <div class="insight-card languages">
      <div class="card-header">
        <span class="card-icon">💻</span>
        <h3>Languages</h3>
      </div>
      <div class="card-content">
        {#if scanData.languages.length > 0}
          <div class="tag-list">
            {#each scanData.languages as language}
              <span class="tag">{language}</span>
            {/each}
          </div>
        {:else}
          <p class="empty-state">Run a scan to detect languages</p>
        {/if}
      </div>
    </div>

    <div class="insight-card recommendations">
      <div class="card-header">
        <span class="card-icon">💡</span>
        <h3>Quick Actions</h3>
      </div>
      <div class="card-content">
        <ul class="action-list">
          <li>Review security findings</li>
          <li>Update dependencies</li>
          <li>Check compliance status</li>
        </ul>
      </div>
    </div>
  </div>
</div>

<style>
  .dashboard {
    animation: slideIn 0.3s ease-out;
  }

  .scan-section {
    margin-bottom: 2rem;
    text-align: center;
  }

  .scan-section h2 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    color: var(--vscode-foreground);
  }

  .scan-button {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 2rem;
    background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.2);
  }

  .scan-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(30, 64, 175, 0.3);
  }

  .scan-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .scan-button .icon {
    font-size: 1.2rem;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .last-scan {
    margin-top: 1rem;
    font-size: 0.875rem;
    color: var(--vscode-descriptionForeground);
  }

  .insights-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .insight-card {
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 8px;
    padding: 1.25rem;
    transition: all 0.2s ease;
  }

  .insight-card:hover {
    border-color: rgba(30, 64, 175, 0.3);
    box-shadow: 0 2px 8px rgba(30, 64, 175, 0.1);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .card-icon {
    font-size: 1.5rem;
  }

  .card-header h3 {
    font-size: 1rem;
    margin: 0;
    color: var(--vscode-foreground);
  }

  .card-value {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  .card-footer {
    display: flex;
    gap: 0.5rem;
  }

  .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .status-badge.success {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  .status-badge.warning {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
  }

  .status-badge.critical {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  .card-content {
    min-height: 60px;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .tag {
    padding: 0.375rem 0.75rem;
    background: rgba(30, 64, 175, 0.1);
    color: #1e40af;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .empty-state {
    color: var(--vscode-descriptionForeground);
    font-size: 0.875rem;
    text-align: center;
    padding: 1rem 0;
  }

  .action-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .action-list li {
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--vscode-panel-border);
    font-size: 0.875rem;
    color: var(--vscode-foreground);
  }

  .action-list li:last-child {
    border-bottom: none;
  }

  .action-list li::before {
    content: "→";
    margin-right: 0.5rem;
    color: #1e40af;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>