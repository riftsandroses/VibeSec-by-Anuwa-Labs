<script lang="ts">
  import { onMount } from 'svelte';
  
  interface Props {
    userData: any;
    theme: 'dark' | 'light';
  }

  let { userData, theme }: Props = $props();
  
  let scanning = $state(false);
  let scanProgress = $state(0);
  let stats = $state({
    vulnerabilities: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    frameworks: [] as string[],
    languages: [] as string[]
  });

  // @ts-ignore
  const vscode = acquireVsCodeApi();

  onMount(() => {
    // Listen for scan results
    window.addEventListener('message', (event) => {
      const message = event.data;
      switch (message.type) {
        case 'zipCreated':
          scanProgress = 50;
          // Upload zip
          vscode.postMessage({ 
            type: 'uploadZip', 
            zipPath: message.path,
            token: userData.token 
          });
          break;
        case 'scanComplete':
          scanProgress = 100;
          setTimeout(() => {
            scanning = false;
            scanProgress = 0;
            // Update stats with real data
            stats = message.data.stats || stats;
          }, 500);
          break;
        case 'scanError':
          scanning = false;
          scanProgress = 0;
          break;
      }
    });
  });

  function runScan() {
    scanning = true;
    scanProgress = 10;
    vscode.postMessage({ type: 'runScan' });
  }
</script>

<div class="dashboard">
  <div class="scan-section">
    <h2>Security Analysis</h2>
    <p class="subtitle">Scan your workspace for vulnerabilities and security issues</p>
    
    <button 
      class="scan-btn {scanning ? 'scanning' : ''}" 
      onclick={runScan}
      disabled={scanning}
    >
      {#if scanning}
        <span class="spinner"></span>
        <span>Scanning... {scanProgress}%</span>
      {:else}
        <span class="scan-icon">🔍</span>
        <span>Initialize Security Scan</span>
      {/if}
    </button>

    {#if scanning}
      <div class="progress-bar">
        <div class="progress-fill" style="width: {scanProgress}%"></div>
      </div>
    {/if}
  </div>

  <div class="stats-grid">
    <div class="stat-card vulnerabilities">
      <div class="stat-icon">⚠️</div>
      <div class="stat-content">
        <h3>Total Vulnerabilities</h3>
        <p class="stat-value">{stats.vulnerabilities}</p>
      </div>
    </div>

    <div class="severity-cards">
      <div class="severity-card critical">
        <span class="severity-label">Critical</span>
        <span class="severity-value">{stats.critical}</span>
      </div>
      <div class="severity-card high">
        <span class="severity-label">High</span>
        <span class="severity-value">{stats.high}</span>
      </div>
      <div class="severity-card medium">
        <span class="severity-label">Medium</span>
        <span class="severity-value">{stats.medium}</span>
      </div>
      <div class="severity-card low">
        <span class="severity-label">Low</span>
        <span class="severity-value">{stats.low}</span>
      </div>
    </div>

    <div class="stat-card frameworks">
      <div class="stat-icon">🔧</div>
      <div class="stat-content">
        <h3>Detected Frameworks</h3>
        <div class="tags">
          {#if stats.frameworks.length > 0}
            {#each stats.frameworks as framework}
              <span class="tag">{framework}</span>
            {/each}
          {:else}
            <span class="placeholder">Run scan to detect frameworks</span>
          {/if}
        </div>
      </div>
    </div>

    <div class="stat-card languages">
      <div class="stat-icon">💻</div>
      <div class="stat-content">
        <h3>Programming Languages</h3>
        <div class="tags">
          {#if stats.languages.length > 0}
            {#each stats.languages as language}
              <span class="tag">{language}</span>
            {/each}
          {:else}
            <span class="placeholder">Run scan to detect languages</span>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <div class="info-card">
    <h3>🛡️ About VibeSec</h3>
    <p>
      VibeSec by Anuwa Labs provides comprehensive security analysis for your codebase.
      Our advanced scanning engine detects vulnerabilities, analyzes dependencies, and
      provides actionable insights to secure your applications.
    </p>
  </div>
</div>

<style>
  .dashboard {
    max-width: 100%;
    animation: fadeIn 0.4s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .scan-section {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 1rem;
    padding: 2rem;
    margin-bottom: 1.5rem;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .scan-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
    animation: shimmer 3s infinite;
  }

  @keyframes shimmer {
    to {
      left: 100%;
    }
  }

  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: var(--text);
  }

  .subtitle {
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin-bottom: 1.5rem;
  }

  .scan-btn {
    background: linear-gradient(135deg, var(--primary), var(--primary-light));
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 0.75rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
    position: relative;
    z-index: 1;
  }

  .scan-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(30, 64, 175, 0.4);
  }

  .scan-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .scan-btn.scanning {
    animation: pulse 2s ease-in-out infinite;
  }

  .scan-icon {
    font-size: 1.2rem;
  }

  .spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .progress-bar {
    width: 100%;
    height: 4px;
    background: var(--border);
    border-radius: 2px;
    margin-top: 1rem;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary), var(--primary-light));
    transition: width 0.3s ease;
    border-radius: 2px;
  }

  .stats-grid {
    display: grid;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .stat-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 1rem;
    padding: 1.5rem;
    display: flex;
    gap: 1rem;
    transition: all 0.3s ease;
    animation: slideUp 0.4s ease;
    animation-fill-mode: both;
  }

  .stat-card:nth-child(1) { animation-delay: 0.1s; }
  .stat-card:nth-child(2) { animation-delay: 0.2s; }
  .stat-card:nth-child(3) { animation-delay: 0.3s; }
  .stat-card:nth-child(4) { animation-delay: 0.4s; }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    border-color: var(--primary);
  }

  .stat-icon {
    font-size: 2rem;
    flex-shrink: 0;
  }

  .stat-content {
    flex: 1;
  }

  .stat-content h3 {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text);
  }

  .vulnerabilities .stat-value {
    color: var(--danger);
  }

  .severity-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.75rem;
  }

  .severity-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    transition: all 0.3s ease;
  }

  .severity-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .severity-label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .severity-value {
    font-size: 1.5rem;
    font-weight: 700;
  }

  .severity-card.critical {
    border-left: 4px solid #dc2626;
  }

  .severity-card.critical .severity-label {
    color: #dc2626;
  }

  .severity-card.high {
    border-left: 4px solid #ea580c;
  }

  .severity-card.high .severity-label {
    color: #ea580c;
  }

  .severity-card.medium {
    border-left: 4px solid #f59e0b;
  }

  .severity-card.medium .severity-label {
    color: #f59e0b;
  }

  .severity-card.low {
    border-left: 4px solid #10b981;
  }

  .severity-card.low .severity-label {
    color: #10b981;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .tag {
    background: var(--primary);
    color: white;
    padding: 0.375rem 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .tag:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgba(30, 64, 175, 0.3);
  }

  .placeholder {
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-style: italic;
  }

  .info-card {
    background: linear-gradient(135deg, var(--bg-secondary), var(--bg));
    border: 1px solid var(--border);
    border-radius: 1rem;
    padding: 1.5rem;
    animation: slideUp 0.4s ease 0.5s both;
  }

  .info-card h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
    color: var(--text);
  }

  .info-card p {
    color: var(--text-secondary);
    line-height: 1.6;
    font-size: 0.875rem;
  }

  @media (max-width: 640px) {
    .scan-section {
      padding: 1.5rem;
    }

    h2 {
      font-size: 1.25rem;
    }

    .scan-btn {
      width: 100%;
      justify-content: center;
    }

    .severity-cards {
      grid-template-columns: repeat(2, 1fr);
    }

    .stat-card {
      padding: 1rem;
    }
  }
</style>