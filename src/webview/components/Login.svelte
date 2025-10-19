<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  interface Props {
    theme: 'dark' | 'light';
  }

  let { theme }: Props = $props();
  
  const dispatch = createEventDispatcher();
  
  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let error = $state('');

  async function handleLogin() {
    if (!email || !password) {
      error = 'Please enter both email and password';
      return;
    }

    loading = true;
    error = '';

    try {
      // Replace with actual API endpoint
      const response = await fetch('YOUR_API_ENDPOINT/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      
      dispatch('login', {
        token: data.token,
        userData: data.user
      });
    } catch (err) {
      error = err instanceof Error ? err.message : 'Login failed';
    } finally {
      loading = false;
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleLogin();
    }
  }
</script>

<div class="login-container">
  <div class="login-box">
    <div class="login-header">
      <div class="logo">
        <div class="shield-icon">🛡️</div>
        <h1>VibeSec</h1>
      </div>
      <p class="tagline">by Anuwa Labs</p>
    </div>

    <div class="welcome">
      <h2>Welcome Back</h2>
      <p>Sign in to access your security dashboard</p>
    </div>

    <form onsubmit|preventDefault={handleLogin}>
      <div class="form-group">
        <label for="email">Email Address</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          onkeypress={handleKeyPress}
          placeholder="you@example.com"
          required
        />
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          onkeypress={handleKeyPress}
          placeholder="••••••••"
          required
        />
      </div>

      {#if error}
        <div class="error-message">
          <span class="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      {/if}

      <button type="submit" class="login-btn" disabled={loading}>
        {#if loading}
          <span class="spinner"></span>
          <span>Signing In...</span>
        {:else}
          <span>Sign In</span>
        {/if}
      </button>
    </form>

    <div class="login-footer">
      <p>Don't have an account? <a href="https://anuwalabs.com/contact" target="_blank">Contact Us</a></p>
    </div>
  </div>

  <div class="background-decoration">
    <div class="circle circle-1"></div>
    <div class="circle circle-2"></div>
    <div class="circle circle-3"></div>
  </div>
</div>

<style>
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    position: relative;
    overflow: hidden;
    background: var(--bg);
  }

  .background-decoration {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
  }

  .circle {
    position: absolute;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary), var(--primary-light));
    opacity: 0.1;
    animation: float 20s ease-in-out infinite;
  }

  .circle-1 {
    width: 300px;
    height: 300px;
    top: -150px;
    right: -150px;
  }

  .circle-2 {
    width: 200px;
    height: 200px;
    bottom: -100px;
    left: -100px;
    animation-delay: -5s;
  }

  .circle-3 {
    width: 150px;
    height: 150px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation-delay: -10s;
  }

  @keyframes float {
    0%, 100% {
      transform: translate(0, 0) scale(1);
    }
    33% {
      transform: translate(30px, -30px) scale(1.1);
    }
    66% {
      transform: translate(-20px, 20px) scale(0.9);
    }
  }

  .login-box {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 1.5rem;
    padding: 2.5rem;
    max-width: 420px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    position: relative;
    z-index: 1;
    animation: slideUp 0.6s ease;
    backdrop-filter: blur(10px);
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .login-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .shield-icon {
    font-size: 2.5rem;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }

  .logo h1 {
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary-light);
    margin: 0;
  }

  .tagline {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0;
  }

  .welcome {
    text-align: center;
    margin-bottom: 2rem;
  }

  .welcome h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: var(--text);
  }

  .welcome p {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 0.5rem;
  }

  input {
    width: 100%;
    padding: 0.875rem 1rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    font-size: 0.875rem;
    color: var(--text);
    transition: all 0.2s ease;
    font-family: inherit;
  }

  input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
  }

  input::placeholder {
    color: var(--text-secondary);
    opacity: 0.6;
  }

  .error-message {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid var(--danger);
    border-radius: 0.5rem;
    padding: 0.75rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--danger);
    font-size: 0.875rem;
    animation: shake 0.3s ease;
  }

  @keyframes shake {
    0%, 100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-10px);
    }
    75% {
      transform: translateX(10px);
    }
  }

  .error-icon {
    font-size: 1.2rem;
  }

  .login-btn {
    width: 100%;
    background: linear-gradient(135deg, var(--primary), var(--primary-light));
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
    box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
  }

  .login-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(30, 64, 175, 0.4);
  }

  .login-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
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

  .login-footer {
    text-align: center;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border);
  }

  .login-footer p {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .login-footer a {
    color: var(--primary-light);
    text-decoration: none;
    font-weight: 600;
    transition: color 0.2s ease;
  }

  .login-footer a:hover {
    color: var(--primary);
    text-decoration: underline;
  }

  @media (max-width: 640px) {
    .login-container {
      padding: 1rem;
    }

    .login-box {
      padding: 2rem 1.5rem;
    }

    .logo h1 {
      font-size: 1.75rem;
    }

    .welcome h2 {
      font-size: 1.25rem;
    }
  }
</style>