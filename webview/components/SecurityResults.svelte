<script>
  import { createEventDispatcher } from 'svelte';
  import { resultsStore, authStore } from '../stores';
  import Header from './Header.svelte';
  import VulnerabilityTable from './VulnerabilityTable.svelte';
  import vscode from '../vscode.js';

  const dispatch = createEventDispatcher();
  

  let results;
  let tokens;
  
  resultsStore.subscribe(value => results = value);
  authStore.subscribe(value => tokens = value);

  let expandedRow = null;

  function toggleRow(id) {
    expandedRow = expandedRow === id ? null : id;
  }

  function fixVulnerability(vulnerability) {
    dispatch('loading', true);
    vscode.postMessage({
      type: 'fixVulnerability',
      vulnerability
    });
  }

  function fixAll(filter) {
    dispatch('loading', true);
    vscode.postMessage({
      type: 'fixAll',
      vulnerabilities: results.vulnerabilities,
      filter
    });
  }

  function navigateToDashboard() {
    dispatch('navigate', 'dashboard');
  }

  function navigateToProfile() {
    dispatch('loading', true);
    vscode.postMessage({
      type: 'getProfile',
      tokens
    });
  }
</script>

<div class="results-page">
  <Header on:profileClick={navigateToProfile} />

  <div class="content">
    <div class="page-header">
      <button class="back-btn" on:click={navigateToDashboard}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5m0 0l7 7m-7-7l7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Back to Dashboard
      </button>
      <h1>Security Testing Results</h1>
      <p class="subtitle">Review and fix identified vulnerabilities</p>
    </div>

    {#if results && results.vulnerabilities}
      <VulnerabilityTable 
        vulnerabilities={results.vulnerabilities}
        {expandedRow}
        on:toggleRow={(e) => toggleRow(e.detail)}
        on:fixVulnerability={(e) => fixVulnerability(e.detail)}
      />

      <div class="action-buttons">
        <button class="action-btn primary" on:click={() => fixAll('all')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2"/>
          </svg>
          Fix All
        </button>
        <button class="action-btn warning" on:click={() => fixAll('highCritical')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2"/>
          </svg>
          Fix High/Critical
        </button>
        <button class="action-btn secondary" on:click={() => fixAll('exploitable')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" stroke-width="2"/>
          </svg>
          Fix Exploitable
        </button>
      </div>
    {:else}
      <div class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="1.5"/>
        </svg>
        <p>No vulnerabilities found</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .results-page {
    min-height: 100vh;
    background: var(--vscode-editor-background);
  }

  .content {
    padding: 24px 20px;
  }

  .page-header {
    margin-bottom: 24px;
  }

  .back-btn {
    background: transparent;
    border: none;
    color: var(--vscode-textLink-foreground);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    padding: 8px 0;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
    transition: opacity 0.2s ease;
  }

  .back-btn:hover {
    opacity: 0.8;
  }

  .page-header h1 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 6px;
    color: var(--vscode-editor-foreground);
  }

  .subtitle {
    font-size: 14px;
    color: var(--vscode-descriptionForeground);
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 20px;
  }

  .action-btn {
    padding: 12px 20px;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s ease;
  }

  .action-btn.primary {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
  }
  .action-btn.primary:hover {
    background: var(--vscode-button-hoverBackground);
    transform: translateY(-1px);
  }

  .action-btn.warning {
    background-color: rgba(255, 180, 50, 0.18);
    border: 1px solid rgba(255, 180, 50, 0.35);
    color: rgb(255, 200, 100);
  }
  .action-btn.warning:hover {
    background-color: rgba(255, 180, 50, 0.28);
    transform: translateY(-1px);
  }

  .action-btn.secondary {
    background-color: rgba(255, 90, 90, 0.18);
    border: 1px solid rgba(255, 90, 90, 0.35);
    color: rgb(255, 130, 130);
  }
  .action-btn.secondary:hover {
    background-color: rgba(255, 90, 90, 0.28);
    transform: translateY(-1px);
  }

  .vscode-dark .action-btn.warning,
  .vscode-dark .action-btn.secondary {
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.05);
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--vscode-descriptionForeground);
  }

  .empty-state svg {
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .empty-state p {
    font-size: 15px;
  }
</style>