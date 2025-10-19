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