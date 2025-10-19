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