<script>
  import { createEventDispatcher } from 'svelte';
  import vscode from '../vscode.js';

  const dispatch = createEventDispatcher();

  let username = '';
  let password = '';
  let errors = { username: '', password: '' };

  let iconSrc = window.ICON_URI;

  function validate() {
    errors = { username: '', password: '' };
    let isValid = true;

    if (!username.trim()) {
      errors.username = 'Username is required';
      isValid = false;
    }

    if (!password.trim()) {
      errors.password = 'Password is required';
      isValid = false;
    }

    return isValid;
  }

  function handleLogin() {
    if (!validate()) return;

    dispatch('loading', true);
    vscode.postMessage({
      type: 'login',
      credentials: { username, password }
    });
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter') {
      handleLogin();
    }
  }
</script>

<div class="login-container">
  <div class="login-card">
    <div class="logo-section">
      <div class="logo-icon">
        <img src={iconSrc} alt="VibeSec Logo" width="90" height="90" />
      </div>
      <h1>VibeSec</h1>
      <p class="subtitle">by Anuwa Labs</p>
    </div>

    <form on:submit|preventDefault={handleLogin}>
      <div class="form-group">
        <label for="username">Username</label>
        <input
          id="username"
          type="text"
          bind:value={username}
          on:keypress={handleKeyPress}
          placeholder="Enter your username"
          class:error={errors.username}
        />
        {#if errors.username}
          <span class="error-message">{errors.username}</span>
        {/if}
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          on:keypress={handleKeyPress}
          placeholder="Enter your password"
          class:error={errors.password}
        />
        {#if errors.password}
          <span class="error-message">{errors.password}</span>
        {/if}
      </div>

      <button type="submit" class="primary-button">
        Sign In
      </button>
    </form>

    <div class="footer-links">
      <a href="#">Forgot password?</a>
      <span class="separator">•</span>
      <a href="#">Create account</a>
    </div>
  </div>
</div>

<style>
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: var(--vscode-editor-background);
  }

  .login-card {
    width: 100%;
    max-width: 360px;
    background: var(--vscode-sideBar-background);
    border-radius: 16px;
    padding: 32px 28px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  }

  .logo-section {
    text-align: center;
    margin-bottom: 32px;
  }

  .logo-icon {
    display: inline-block;
    margin-bottom: 20px;
  }

  h1 {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 4px;
    color: var(--vscode-editor-foreground);
  }

  .subtitle {
    font-size: 14px;
    color: var(--vscode-descriptionForeground);
    font-weight: 500;
  }

  .form-group {
    margin-bottom: 20px;
  }

  label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 8px;
    color: var(--vscode-editor-foreground);
  }

  input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid var(--vscode-input-border);
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.2s ease;
    outline: none;
  }

  input:focus {
    border-color: var(--vscode-focusBorder);
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
  }

  input.error {
    border-color: var(--vscode-inputValidation-errorBorder);
  }

  .error-message {
    display: block;
    margin-top: 6px;
    font-size: 12px;
    color: var(--vscode-inputValidation-errorForeground);
  }

  .primary-button {
    width: 100%;
    padding: 12px 24px;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: 8px;
  }

  .primary-button:hover {
    background: var(--vscode-button-hoverBackground);
    transform: translateY(-1px);
  }

  .primary-button:active {
    transform: translateY(0);
  }

  .footer-links {
    margin-top: 24px;
    text-align: center;
    font-size: 13px;
  }

  .footer-links a {
    color: var(--vscode-textLink-foreground);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .footer-links a:hover {
    color: var(--vscode-textLink-activeForeground);
  }

  .separator {
    margin: 0 12px;
    color: var(--vscode-descriptionForeground);
  }
</style>