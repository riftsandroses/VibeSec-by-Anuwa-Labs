<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let userData: {
    name: string;
    email: string;
    profilePicture: string;
    licenseStatus: string;
    serverHealth: string;
  };

  const dispatch = createEventDispatcher();

  function handleLogout() {
    dispatch('logout');
  }

  function getHealthColor(health: string) {
    switch (health.toLowerCase()) {
      case 'healthy':
        return '#10b981';
      case 'degraded':
        return '#f59e0b';
      case 'down':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  }

  function getLicenseColor(status: string) {
    return status.toLowerCase() === 'active' ? '#10b981' : '#f59e0b';
  }
</script>

<div class="profile">
  <div class="profile-header">
    <div class="avatar-container">
      <img src={userData.profilePicture} alt={userData.name} class="avatar" />
      <div class="avatar-badge">✓</div>
    </div>
    <h2 class="profile-name">{userData.name}</h2>
    <p class="profile-email">{userData.email}</p>
  </div>

  <div class="profile-sections">
    <div class="profile-section">
      <h3>System Status</h3>
      <div class="status-grid">
        <div class="status-item">
          <span class="status-label">Server Health</span>
          <div class="status-value">
            <span 
              class="status-indicator" 
              style="background-color: {getHealthColor(userData.serverHealth)}"
            ></span>
            <span>{userData.serverHealth}</span>
          </div>
        </div>
        
        <div class="status-item">
          <span class="status-label">License Status</span>
          <div class="status-value">
            <span 
              class="status-indicator" 
              style="background-color: {getLicenseColor(userData.licenseStatus)}"
            ></span>
            <span>{userData.licenseStatus}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="profile-section">
      <h3>Account Information</h3>
      <div class="info-list">
        <div class="info-item">
          <span class="info-label">Email</span>
          <span class="info-value">{userData.email}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Organization</span>
          <span class="info-value">Anuwa Labs</span>
        </div>
        <div class="info-item">
          <span class="info-label">Plan</span>
          <span class="info-value">Professional</span>
        </div>
      </div>
    </div>

    <div class="profile-section">
      <h3>Actions</h3>
      <div class="action-buttons">
        <button class="action-btn secondary">Manage Subscription</button>
        <button class="action-btn secondary">View Documentation</button>
        <button class="action-btn danger" on:click={handleLogout}>Sign Out</button>
      </div>
    </div>
  </div>
</div>

<style>
  .profile {
    animation: fadeIn 0.3s ease-out;
  }

  .profile-header {
    text-align: center;
    padding: 2rem 0;
    border-bottom: 1px solid var(--vscode-panel-border);
    margin-bottom: 2rem;
  }

  .avatar-container {
    position: relative;
    display: inline-block;
    margin-bottom: 1rem;
  }

  .avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 3px solid #1e40af;
    object-fit: cover;
  }

  .avatar-badge {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 24px;
    height: 24px;
    background: #10b981;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.75rem;
    border: 2px solid var(--vscode-editor-background);
  }

  .profile-name {
    font-size: 1.5rem;
    margin: 0 0 0.25rem 0;
    color: var(--vscode-foreground);
    font-weight: 600;
  }

  .profile-email {
    color: var(--vscode-descriptionForeground);
    margin: 0;
    font-size: 0.875rem;
  }

  .profile-sections {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .profile-section {
    background: var(--vscode-editor-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 8px;
    padding: 1.25rem;
  }

  .profile-section h3 {
    font-size: 1rem;
    margin: 0 0 1rem 0;
    color: var(--vscode-foreground);
    font-weight: 600;
  }

  .status-grid {
    display: grid;
    gap: 1rem;
  }

  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: var(--vscode-input-background);
    border-radius: 6px;
  }

  .status-label {
    font-size: 0.875rem;
    color: var(--vscode-descriptionForeground);
  }

  .status-value {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--vscode-foreground);
  }

  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }

  .info-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--vscode-panel-border);
  }

  .info-item:last-child {
    border-bottom: none;
  }

  .info-label {
    font-size: 0.875rem;
    color: var(--vscode-descriptionForeground);
  }

  .info-value {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--vscode-foreground);
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .action-btn {
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn.secondary {
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
  }

  .action-btn.secondary:hover {
    background: var(--vscode-button-secondaryHoverBackground);
  }

  .action-btn.danger {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  .action-btn.danger:hover {
    background: rgba(239, 68, 68, 0.2);
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
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
</style>