<script>
  import { createEventDispatcher } from 'svelte';
  import { authStore, dashboardStore } from '../stores';
  import Header from './Header.svelte';
  import vscode from '../vscode.js';

  const dispatch = createEventDispatcher();

  let tokens;
  authStore.subscribe(value => {
    tokens = value;
    console.log('🔑 Tokens updated:', tokens); // Add this);
  });

  // Mock dashboard data - replace with actual API data
  let insights = {
    totalScans: 12,
    criticalIssues: 3,
    highIssues: 8,
    mediumIssues: 15,
    lowIssues: 22,
    lastScanDate: '2025-10-18',
    reachableVulnerabilities: 5
  };

  function startSecurityTest() {
    dispatch('loading', true);
    vscode.postMessage({
      type: 'startSecurityTest',
      tokens
    });
  }

  function navigateToProfile() {
    dispatch('loading', true);
    vscode.postMessage({
      type: 'getProfile',
      tokens
    });
  }
</script>

<div class="dashboard">
  <Header on:profileClick={navigateToProfile} />

  <div class="content">
    <div class="welcome-section">
      <h1>Insights Dashboard</h1>
      <p class="description">Security summary from previous scans</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon critical">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{insights.criticalIssues}</div>
          <div class="stat-label">Critical Issues</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon high">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 8v4m0 4h.01M3 12l9-9 9 9-9 9-9-9z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{insights.highIssues}</div>
          <div class="stat-label">High Severity</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon medium">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{insights.mediumIssues}</div>
          <div class="stat-label">Medium Severity</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon low">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{insights.lowIssues}</div>
          <div class="stat-label">Low Severity</div>
        </div>
      </div>
    </div>

    <div class="info-cards">
      <div class="info-card">
        <div class="info-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>Total Scans</span>
        </div>
        <div class="info-value">{insights.totalScans}</div>
      </div>

      <div class="info-card">
        <div class="info-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Reachable Vulnerabilities</span>
        </div>
        <div class="info-value">{insights.reachableVulnerabilities}</div>
      </div>

      <div class="info-card">
        <div class="info-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>Last Scan</span>
        </div>
        <div class="info-value">{insights.lastScanDate}</div>
      </div>
    </div>

    <div class="action-section">
      <button class="scan-button" on:click={startSecurityTest}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Start Security Testing
      </button>
      <p class="scan-hint">Analyze your workspace for security vulnerabilities</p>
    </div>
  </div>
</div>

<style>
  .dashboard {
    min-height: 100vh;
    background: var(--vscode-editor-background);
  }

  .content {
    padding: 24px 20px;
  }

  .welcome-section {
    margin-bottom: 28px;
  }

  .welcome-section h1 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 6px;
    color: var(--vscode-editor-foreground);
  }

  .description {
    font-size: 14px;
    color: var(--vscode-descriptionForeground);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }

  .stat-card {
    background: var(--vscode-sideBar-background);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    border: 1px solid var(--vscode-panel-border);
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stat-icon.critical {
    background: rgba(255, 59, 48, 0.15);
    color: #FF3B30;
  }

  .stat-icon.high {
    background: rgba(255, 149, 0, 0.15);
    color: #FF9500;
  }

  .stat-icon.medium {
    background: rgba(255, 204, 0, 0.15);
    color: #FFCC00;
  }

  .stat-icon.low {
    background: rgba(52, 199, 89, 0.15);
    color: #34C759;
  }

  .stat-info {
    flex: 1;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 600;
    color: var(--vscode-editor-foreground);
    line-height: 1;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
    font-weight: 500;
  }

  .info-cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
  }

  .info-card {
    background: var(--vscode-sideBar-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 12px;
    padding: 16px;
  }

  .info-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    color: var(--vscode-descriptionForeground);
    font-size: 13px;
    font-weight: 500;
  }

  .info-value {
    font-size: 20px;
    font-weight: 600;
    color: var(--vscode-editor-foreground);
  }

  .action-section {
    text-align: center;
    margin-top: 32px;
  }

  .scan-button {
    width: 100%;
    padding: 14px 24px;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: all 0.2s ease;
  }

  .scan-button:hover {
    background: var(--vscode-button-hoverBackground);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  .scan-button:active {
    transform: translateY(0);
  }

  .scan-hint {
    margin-top: 12px;
    font-size: 13px;
    color: var(--vscode-descriptionForeground);
  }
</style>