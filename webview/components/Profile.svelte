<script>
  import { createEventDispatcher } from 'svelte';
  import { profileStore } from '../stores';
  import Header from './Header.svelte';

  const dispatch = createEventDispatcher();

  let profile;
  profileStore.subscribe(value => profile = value);

  function navigateToDashboard() {
    dispatch('navigate', 'dashboard');
  }

  function getServerStatusClass(status) {
    if (!status) return 'unknown';
    return status.toLowerCase();
  }
</script>

<div class="profile-page">
  <Header on:profileClick={() => {}} />

  <div class="content">
    <div class="page-header">
      <button class="back-btn" on:click={navigateToDashboard}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M19 12H5m0 0l7 7m-7-7l7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Back to Dashboard
      </button>
      <h1>Profile</h1>
    </div>

    {#if profile}
      <div class="profile-card">
        <div class="profile-header">
          <div class="avatar">
            {#if profile.profilePicture}
              <img src={profile.profilePicture} alt={profile.name} />
            {:else}
              <div class="avatar-placeholder">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2m8-10a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" stroke-width="2"/>
                </svg>
              </div>
            {/if}
          </div>
          <div class="profile-info">
            <h2>{profile.name || 'User'}</h2>
            <p class="email">{profile.email || 'user@example.com'}</p>
          </div>
        </div>

        <div class="profile-details">
          <div class="detail-item">
            <span class="detail-label">Account Type</span>
            <span class="detail-value">{profile.accountType || 'Standard'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Member Since</span>
            <span class="detail-value">{profile.memberSince || 'N/A'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Organization</span>
            <span class="detail-value">{profile.organization || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <h3>Server Health</h3>
        </div>
        <div class="server-status">
          <div class="status-indicator {getServerStatusClass(profile.serverHealth?.status)}"></div>
          <div class="status-info">
            <div class="status-label">Status: <strong>{profile.serverHealth?.status || 'Unknown'}</strong></div>
            <div class="status-details">
              {#if profile.serverHealth?.uptime}
                <span>Uptime: {profile.serverHealth.uptime}</span>
              {/if}
              {#if profile.serverHealth?.responseTime}
                <span>Response: {profile.serverHealth.responseTime}ms</span>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <h3>User Guide</h3>
        </div>
        <div class="guide-content">
          <div class="guide-item">
            <div class="guide-number">1</div>
            <div class="guide-text">
              <h4>Start Security Test</h4>
              <p>Click the "Start Security Testing" button on the dashboard to scan your workspace</p>
            </div>
          </div>
          <div class="guide-item">
            <div class="guide-number">2</div>
            <div class="guide-text">
              <h4>Review Results</h4>
              <p>Examine identified vulnerabilities with severity levels and detailed information</p>
            </div>
          </div>
          <div class="guide-item">
            <div class="guide-number">3</div>
            <div class="guide-text">
              <h4>Apply Fixes</h4>
              <p>Use "Fix Vulnerability" buttons to automatically apply suggested fixes to your code</p>
            </div>
          </div>
          <div class="guide-item">
            <div class="guide-number">4</div>
            <div class="guide-text">
              <h4>Bulk Actions</h4>
              <p>Fix multiple vulnerabilities at once using "Fix All", "Fix High/Critical", or "Fix Exploitable"</p>
            </div>
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" stroke="currentColor" stroke-width="2"/>
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" stroke-width="2"/>
          </svg>
          <h3>Settings</h3>
        </div>
        <div class="settings-list">
          <button class="setting-item">
            <span>API Configuration</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="setting-item">
            <span>Notification Preferences</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="setting-item">
            <span>About VibeSec</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <button class="logout-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m5 5H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Sign Out
      </button>
    {:else}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading profile...</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .profile-page {
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
    color: var(--vscode-editor-foreground);
  }

  .profile-card {
    background: var(--vscode-sideBar-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
  }

  .profile-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--vscode-panel-border);
  }

  .avatar {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    overflow: hidden;
    flex-shrink: 0;
  }

  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #007AFF, #5856D6);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .profile-info h2 {
    font-size: 18px;
    font-weight: 600;
    color: var(--vscode-editor-foreground);
    margin-bottom: 4px;
  }

  .email {
    font-size: 13px;
    color: var(--vscode-descriptionForeground);
  }

  .profile-details {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .detail-label {
    font-size: 13px;
    color: var(--vscode-descriptionForeground);
  }

  .detail-value {
    font-size: 13px;
    font-weight: 600;
    color: var(--vscode-editor-foreground);
  }

  .section-card {
    background: var(--vscode-sideBar-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    color: var(--vscode-editor-foreground);
  }

  .section-header h3 {
    font-size: 16px;
    font-weight: 600;
  }

  .server-status {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status-indicator.online {
    background: #34C759;
    box-shadow: 0 0 8px rgba(52, 199, 89, 0.5);
  }

  .status-indicator.offline {
    background: #FF3B30;
  }

  .status-indicator.unknown {
    background: #8E8E93;
  }

  .status-info {
    flex: 1;
  }

  .status-label {
    font-size: 14px;
    color: var(--vscode-editor-foreground);
    margin-bottom: 4px;
  }

  .status-label strong {
    font-weight: 600;
  }

  .status-details {
    font-size: 12px;
    color: var(--vscode-descriptionForeground);
    display: flex;
    gap: 12px;
  }

  .guide-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .guide-item {
    display: flex;
    gap: 12px;
  }

  .guide-number {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .guide-text h4 {
    font-size: 14px;
    font-weight: 600;
    color: var(--vscode-editor-foreground);
    margin-bottom: 4px;
  }

  .guide-text p {
    font-size: 13px;
    line-height: 1.5;
    color: var(--vscode-descriptionForeground);
  }

  .settings-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .setting-item {
    background: transparent;
    border: none;
    padding: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    border-radius: 8px;
    transition: background 0.2s ease;
    color: var(--vscode-editor-foreground);
    font-size: 14px;
  }

  .setting-item:hover {
    background: var(--vscode-list-hoverBackground);
  }

  .logout-btn {
    width: 100%;
    padding: 12px 20px;
    background: rgba(255, 59, 48, 0.15);
    color: #FF3B30;
    border: 1px solid rgba(255, 59, 48, 0.3);
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 8px;
    transition: all 0.2s ease;
  }

  .logout-btn:hover {
    background: rgba(255, 59, 48, 0.25);
    transform: translateY(-1px);
  }

  .loading-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--vscode-descriptionForeground);
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: var(--vscode-button-background);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 16px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loading-state p {
    font-size: 14px;
  }
</style>