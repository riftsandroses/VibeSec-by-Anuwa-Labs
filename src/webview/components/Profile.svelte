<script lang="ts">
  import { onMount } from 'svelte';
  
  interface Props {
    userData: any;
    onlogout: () => void;
    theme: 'dark' | 'light';
  }

  let { userData, onlogout, theme }: Props = $props();
  
  let serverHealth = $state<'healthy' | 'degraded' | 'down'>('healthy');
  let licenseStatus = $state<'active' | 'expiring' | 'expired'>('active');
  let licenseExpiry = $state('2025-12-31');

  onMount(() => {
    // Simulate server health check
    checkServerHealth();
    const interval = setInterval(checkServerHealth, 30000); // Check every 30s
    
    return () => clearInterval(interval);
  });

  async function checkServerHealth() {
    try {
      // Replace with actual health check endpoint
      const response = await fetch('YOUR_API_ENDPOINT/health');
      if (response.ok) {
        serverHealth = 'healthy';
      } else {
        serverHealth = 'degraded';
      }
    } catch (error) {
      serverHealth = 'down';
    }
  }

  function getHealthColor(status: string) {
    switch (status) {
      case 'healthy': return 'var(--success)';
      case 'degraded': return 'var(--warning)';
      case 'down': return 'var(--danger)';
      default: return 'var(--text-secondary)';
    }
  }

  function getHealthIcon(status: string) {
    switch (status) {
      case 'healthy': return '✓';
      case 'degraded': return '⚠';
      case 'down': return '✗';
      default: return '?';
    }
  }

  function getLicenseColor(status: string) {
    switch (status) {
      case 'active': return 'var(--success)';
      case 'expiring': return 'var(--warning)';
      case 'expired': return 'var(--danger)';
      default: return 'var(--text-secondary)';
    }
  }
</script>

<div class="profile">
  <div class="profile-header">
    <div class="avatar">
      {#if userData?.profilePicture}
        <img src={userData.profilePicture} alt={userData.name} />
      {:else}
        <div class="avatar-placeholder">
          {userData?.name?.charAt(0) || 'U'}
        </div>
      {/if}
    </div>
    <div class="profile-info">
      <h2>{userData?.name || 'User'}</h2>
      <p class="email">{userData?.email || 'user@example.com'}</p>
    </div>
  </div>

  <div class="status-grid">
    <div class="status-card server">
      <div class="status-header">
        <h3>Server Status</h3>
        <div class="status-indicator" style="background: {getHealthColor(serverHealth)}">
          {getHealthIcon(serverHealth)}
        </div>
      </div>
      <p class="status-value" style="color: {getHealthColor(serverHealth)}">
        {serverHealth.charAt(0).toUpperCase() + serverHealth.slice(1)}
      </p>
      <p class="status-detail">Last checked: Just now</p>
    </div>

    <div class="status-card license">
      <div class="status-header">
        <h3>License Status</h3>
        <div class="status-indicator" style="background: {getLicenseColor(licenseStatus)}">
          {licenseStatus === 'active' ? '✓' : licenseStatus === 'expiring' ? '⚠' : '✗'}
        </div>
      </div>
      <p class="status-value" style="color: {getLicenseColor(licenseStatus)}">
        {licenseStatus.charAt(0).toUpperCase() + licenseStatus.slice(1)}
      </p>
      <p class="status-detail">Expires: {licenseExpiry}</p>
    </div>
  </div>

  <div class="info-section">
    <h3>Account Information</h3>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">User ID</span>
        <span class="info-value">{userData?.id || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Account Type</span>
        <span class="info-value">{userData?.accountType || 'Professional'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Member Since</span>
        <span class="info-value">{userData?.memberSince || '2024-01-01'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Scans Used</span>
        <span class="info-value">{userData?.scansUsed || 0} / {userData?.scansLimit || 'Unlimited'}</span>
      </div>
    </div>
  </div>

  <div class="actions">
    <button class="logout-btn" onclick={onlogout}>
      <span class="logout-icon">🚪</span>
      <span>Sign Out</span>
    </button>
  </div>

  <div class="footer">
    <p>VibeSec v1.0.0 • Powered by Anuwa Labs</p>
  </div>
</div>

<style>
  .profile {
    max-width: 600px;
    margin: 0 auto;
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

  .profile-header {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 1rem;
    padding: 2rem;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
    animation: slideUp 0.4s ease;
  }

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

  .avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid var(--primary);
    flex-shrink: 0;
    position: relative;
  }

  .avatar::after {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    padding: 3px;
    background: linear-gradient(45deg, var(--primary), var(--primary-light));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    animation: rotate 3s linear infinite;
  }

  @keyframes rotate {
    to {
      transform: rotate(360deg);
    }
  }

  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, var(--primary), var(--primary-light));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: 700;
    color: white;
  }

  .profile-info h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
    color: var(--text);
  }

  .email {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }

  .status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .status-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 1rem;
    padding: 1.5rem;
    transition: all 0.3s ease;
    animation: slideUp 0.4s ease;
    animation-fill-mode: both;
  }

  .status-card:nth-child(1) { animation-delay: 0.1s; }
  .status-card:nth-child(2) { animation-delay: 0.2s; }

  .status-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  .status-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .status-header h3 {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .status-indicator {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.9;
    }
  }

  .status-value {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }

  .status-detail {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .info-section {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 1rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    animation: slideUp 0.4s ease 0.3s both;
  }

  .info-section h3 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--text);
  }

  .info-grid {
    display: grid;
    gap: 1rem;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--border);
  }

  .info-item:last-child {
    border-bottom: none;
  }

  .info-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .info-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text);
  }

  .actions {
    margin-bottom: 1.5rem;
    animation: slideUp 0.4s ease 0.4s both;
  }

  .logout-btn {
    width: 100%;
    background: var(--danger);
    color: white;
    border: none;
    padding: 1rem;
    border-radius: 0.75rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    transition: all 0.3s ease;
  }

  .logout-btn:hover {
    background: #dc2626;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  }

  .logout-icon {
    font-size: 1.2rem;
  }

  .footer {
    text-align: center;
    padding: 1rem;
    color: var(--text-secondary);
    font-size: 0.75rem;
    animation: fadeIn 0.4s ease 0.5s both;
  }

  @media (max-width: 640px) {
    .profile-header {
      flex-direction: column;
      text-align: center;
    }

    .status-grid {
      grid-template-columns: 1fr;
    }
  }
</style>