import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import archiver from 'archiver';

const TOKEN_ACCESS_KEY = 'vibesec.token.access';
const TOKEN_REFRESH_KEY = 'vibesec.token.refresh';
const NOTIFICATION_PREFS_KEY = 'vibesec.notifications';

interface NotificationPreferences {
  login: boolean;
  logout: boolean;
  securityTest: boolean;
  fixVulnerability: boolean;
  fixAll: boolean;
  dashboard: boolean;
  profile: boolean;
}

export function activate(context: vscode.ExtensionContext) {
  const provider = new VibeSecViewProvider(context.extensionUri, context.secrets, context.globalState);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'vibesec.sidebar',
      provider,
      {
        webviewOptions: {
          retainContextWhenHidden: true
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vibesec.refresh', () => {
      provider.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vibesec.logout', async () => {
      await provider.logout();
    })
  );
}

class VibeSecViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _secrets: vscode.SecretStorage,
    private readonly _globalState: vscode.Memento
  ) {}

  private async getNotificationPreferences(): Promise<NotificationPreferences> {
    const prefs = this._globalState.get<NotificationPreferences>(NOTIFICATION_PREFS_KEY);
    return prefs || {
      login: true,
      logout: true,
      securityTest: true,
      fixVulnerability: true,
      fixAll: true,
      dashboard: true,
      profile: true
    };
  }

  private async showNotification(type: keyof NotificationPreferences, message: string, isError: boolean = false) {
    const prefs = await this.getNotificationPreferences();
    if (prefs[type]) {
      if (isError) {
        vscode.window.showErrorMessage(message);
      } else {
        vscode.window.showInformationMessage(message);
      }
    }
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]	
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'login':
          await this.handleLogin(data.credentials);
          break;
        case 'startSecurityTest':
          await this.handleSecurityTest(data.tokens);
          break;
        case 'getDashboard':
          await this.handleGetDashboard(data.tokens);
          break;
        case 'fixVulnerability':
          await this.handleFixVulnerability(data.vulnerability);
          break;
        case 'fixAll':
          await this.handleFixAll(data.vulnerabilities, data.filter);
          break;
        case 'getProfile':
          await this.handleGetProfile(data.tokens);
          break;
        case 'getNotificationPreferences':
          await this.handleGetNotificationPreferences();
          break;
        case 'updateNotificationPreferences':
          await this.handleUpdateNotificationPreferences(data.preferences);
          break;
        case 'showAlert':
          vscode.window.showInformationMessage(data.message);
          break;
        case 'logout':
          await this.logout();
          break;
        case 'checkSession':
          await this.checkExistingSession();
          break;
      }
    });

    setTimeout(() => {
      this.checkExistingSession();
    }, 100);
  }

  private async handleGetNotificationPreferences() {
    const prefs = await this.getNotificationPreferences();
    this._view?.webview.postMessage({
      type: 'notificationPreferencesLoaded',
      preferences: prefs
    });
  }

  private async handleUpdateNotificationPreferences(preferences: NotificationPreferences) {
    await this._globalState.update(NOTIFICATION_PREFS_KEY, preferences);
    vscode.window.showInformationMessage('✅ Notification preferences updated successfully');
    this._view?.webview.postMessage({
      type: 'notificationPreferencesUpdated',
      preferences
    });
  }

  private async checkExistingSession() {
    try {
      const accessToken = await this._secrets.get(TOKEN_ACCESS_KEY);
      const refreshToken = await this._secrets.get(TOKEN_REFRESH_KEY);

      if (accessToken && refreshToken) {
        console.log('Found existing tokens, validating...');
        
        const tokens = { access: accessToken, refresh: refreshToken };
        const isValid = await this.validateAndRefreshToken(tokens);

        if (isValid) {
          const updatedAccess = await this._secrets.get(TOKEN_ACCESS_KEY);
          const updatedRefresh = await this._secrets.get(TOKEN_REFRESH_KEY);
          
          this._view?.webview.postMessage({
            type: 'restoreSession',
            tokens: {
              access: updatedAccess,
              refresh: updatedRefresh
            }
          });
          console.log('Session restored successfully');
        } else {
          await this.clearTokens();
          this._view?.webview.postMessage({
            type: 'noSession'
          });
          console.log('Token validation failed, cleared session');
        }
      } else {
        this._view?.webview.postMessage({
          type: 'noSession'
        });
        console.log('No existing session found');
      }
    } catch (error) {
      console.error('Error checking session:', error);
      await this.clearTokens();
      this._view?.webview.postMessage({
        type: 'noSession'
      });
    }
  }

  private async validateAndRefreshToken(tokens: { access: string; refresh: string }): Promise<boolean> {
    try {
      const axios = require('axios');
      
      try {
        const response = await axios.get('http://localhost:3007/api/v1/profile', {
          headers: {
            'Authorization': `Bearer ${tokens.access}`
          }
        });

        if (response.data.success) {
          console.log('Access token is valid');
          return true;
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          console.log('Access token expired, attempting refresh...');
          return await this.refreshAccessToken(tokens.refresh);
        }
        throw error;
      }
      
      return false;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  private async refreshAccessToken(refreshToken: string): Promise<boolean> {
    try {
      const axios = require('axios');
      
      const response = await axios.post('http://localhost:3007/api/v1/refresh', 
        { refresh: refreshToken },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const data = response.data;

      if (data.success && data.access) {
        console.log('Token refreshed successfully');
        await this._secrets.store(TOKEN_ACCESS_KEY, data.access);
        
        if (data.refresh) {
          await this._secrets.store(TOKEN_REFRESH_KEY, data.refresh);
        }
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Token refresh failed:', error.response?.data || error.message);
      return false;
    }
  }

  private async makeAuthenticatedRequest(
    tokens: { access: string; refresh: string },
    requestFn: (accessToken: string) => Promise<any>
  ): Promise<any> {
    try {
      return await requestFn(tokens.access);
    } catch (error: any) {
      if (error.response?.status === 401) {
        const refreshed = await this.refreshAccessToken(tokens.refresh);
        
        if (refreshed) {
          const newAccessToken = await this._secrets.get(TOKEN_ACCESS_KEY);
          if (newAccessToken) {
            return await requestFn(newAccessToken);
          }
        }
        
        await this.clearTokens();
        this._view?.webview.postMessage({
          type: 'sessionExpired'
        });
        throw new Error('Session expired');
      }
      throw error;
    }
  }

  private async saveTokens(access: string, refresh: string) {
    await this._secrets.store(TOKEN_ACCESS_KEY, access);
    await this._secrets.store(TOKEN_REFRESH_KEY, refresh);
    console.log('Tokens saved to secure storage');
  }

  private async clearTokens() {
    await this._secrets.delete(TOKEN_ACCESS_KEY);
    await this._secrets.delete(TOKEN_REFRESH_KEY);
    console.log('Tokens cleared from secure storage');
  }

  public async logout() {
    try {
      const accessToken = await this._secrets.get(TOKEN_ACCESS_KEY);
      
      if (accessToken) {
        try {
          const axios = require('axios');
          await axios.post('http://localhost:3007/api/v1/logout', {}, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          console.log('Backend logout successful');
        } catch (error) {
          console.error('Backend logout error:', error);
        }
      }
      
      await this.clearTokens();
      await this.showNotification('logout', '✅ Successfully logged out');
      this._view?.webview.postMessage({
        type: 'logoutSuccess'
      });
    } catch (error) {
      console.error('Logout error:', error);
      await this.clearTokens();
      await this.showNotification('logout', '✅ Successfully logged out');
      this._view?.webview.postMessage({
        type: 'logoutSuccess'
      });
    }
  }

  private async handleLogin(credentials: { username: string; password: string }) {
    try {
      await this.showNotification('login', '🔐 Logging in...');
      const axios = require('axios');
      
      const response = await axios.post('http://localhost:3007/api/v1/login', credentials, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;

      if (data.success && data.access) {
        await this.saveTokens(data.access, data.refresh);
        await this.showNotification('login', '✅ Login successful! Welcome back.');

        this._view?.webview.postMessage({
          type: 'loginSuccess',
          tokens: {
            access: data.access,
            refresh: data.refresh
          }
        });
      } else {
        await this.showNotification('login', '❌ Login failed: ' + (data.message || 'Unknown error'), true);
        this._view?.webview.postMessage({
          type: 'loginError',
          error: data.message || 'Login failed'
        });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Network error occurred';
      await this.showNotification('login', '❌ Login failed: ' + errorMsg, true);
      this._view?.webview.postMessage({
        type: 'loginError',
        error: errorMsg
      });
    }
  }

  private async handleGetDashboard(tokens: { access: string; refresh: string }) {
    try {
      await this.showNotification('dashboard', '📊 Loading dashboard...');
      const data = await this.makeAuthenticatedRequest(tokens, async (accessToken) => {
        const axios = require('axios');
        const response = await axios.get('http://localhost:3007/api/v1/dashboard', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        return response.data;
      });

      if (data.success) {
        await this.showNotification('dashboard', '✅ Dashboard loaded successfully');
        this._view?.webview.postMessage({
          type: 'dashboardSuccess',
          dashboard: data
        });
      } else {
        await this.showNotification('dashboard', '❌ Failed to load dashboard', true);
        this._view?.webview.postMessage({
          type: 'dashboardError',
          error: data.message || 'Failed to fetch dashboard'
        });
      }
    } catch (error: any) {
      await this.showNotification('dashboard', '❌ Failed to load dashboard', true);
      this._view?.webview.postMessage({
        type: 'dashboardError',
        error: error.message || 'Network error occurred'
      });
    }
  }

  private async handleSecurityTest(tokens: { access: string; refresh: string }) {
    try {
      await this.showNotification('securityTest', '🔍 Starting security test...');
      const workspaceFolders = vscode.workspace.workspaceFolders;
      
      if (!workspaceFolders || workspaceFolders.length === 0) {
        await this.showNotification('securityTest', '❌ No workspace folder open', true);
        this._view?.webview.postMessage({
          type: 'securityTestError',
          error: 'No workspace folder open'
        });
        return;
      }

      const workspacePath = workspaceFolders[0].uri.fsPath;
      const zipPath = path.join(workspacePath, '.vibesec-temp.zip');

      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "VibeSec Security Scan",
        cancellable: false
      }, async (progress) => {
        progress.report({ message: "Preparing workspace..." });
        await this.createZipFile(workspacePath, zipPath);
        
        progress.report({ message: "Uploading to server..." });
        const zipBuffer = fs.readFileSync(zipPath);

        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('file', zipBuffer, 'workspace.zip');

        progress.report({ message: "Analyzing code..." });
        const data = await this.makeAuthenticatedRequest(tokens, async (accessToken) => {
          const axios = require('axios');
          const response = await axios.post('http://localhost:3007/api/v1/security-testing/', formData, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              ...formData.getHeaders()
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
          });
          return response.data;
        });

        // Clean up temp file
        if (fs.existsSync(zipPath)) {
          fs.unlinkSync(zipPath);
          console.log('Cleaned up temporary zip file');
        }

        if (data.success && data.vulnerabilities) {
          const vulnCount = data.vulnerabilities.length;
          await this.showNotification('securityTest', `✅ Security scan complete! Found ${vulnCount} vulnerability${vulnCount !== 1 ? 'ies' : 'y'}.`);
          this._view?.webview.postMessage({
            type: 'securityTestSuccess',
            results: data
          });
        } else {
          await this.showNotification('securityTest', '❌ Security test failed', true);
          this._view?.webview.postMessage({
            type: 'securityTestError',
            error: data.message || 'Security test failed'
          });
        }
      });
    } catch (error: any) {
      // Clean up temp file on error
      try {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
          const zipPath = path.join(workspaceFolders[0].uri.fsPath, '.vibesec-temp.zip');
          if (fs.existsSync(zipPath)) {
            fs.unlinkSync(zipPath);
          }
        }
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }

      await this.showNotification('securityTest', '❌ Security test failed: ' + error.message, true);
      this._view?.webview.postMessage({
        type: 'securityTestError',
        error: error.message || 'Unknown error occurred'
      });
    }
  }

  /**
   * Parse .gitignore file and return patterns
   */
  private parseGitignore(gitignorePath: string): string[] {
    try {
      if (!fs.existsSync(gitignorePath)) {
        return [];
      }

      const content = fs.readFileSync(gitignorePath, 'utf-8');
      const patterns: string[] = [];

      content.split('\n').forEach(line => {
        // Remove comments and trim whitespace
        const trimmed = line.split('#')[0].trim();
        
        // Skip empty lines
        if (!trimmed) {
          return;
        }

        // Convert gitignore patterns to glob patterns
        let pattern = trimmed;

        // If pattern starts with /, it's relative to root
        if (pattern.startsWith('/')) {
          pattern = pattern.substring(1);
        }

        // If pattern ends with /, it's a directory
        if (pattern.endsWith('/')) {
          pattern = pattern + '**';
        } else {
          // Add /** for directories without trailing slash
          // This ensures both the file/dir itself and its contents are ignored
          patterns.push(pattern + '/**');
        }

        patterns.push(pattern);
      });

      console.log('Parsed gitignore patterns:', patterns);
      return patterns;
    } catch (error) {
      console.error('Error parsing .gitignore:', error);
      return [];
    }
  }

  private async createZipFile(sourcePath: string, outPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outPath);
      const archive = archiver('zip', { 
        zlib: { level: 9 }
      });

      output.on('close', () => {
        console.log(`Workspace zipped: ${archive.pointer()} total bytes`);
        resolve();
      });
      
      output.on('error', (err) => {
        console.error('Output stream error:', err);
        reject(err);
      });

      archive.on('error', (err) => {
        console.error('Archive error:', err);
        reject(err);
      });

      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          console.warn('Archive warning:', err);
        } else {
          reject(err);
        }
      });

      archive.pipe(output);

      // Default exclusion patterns
      const excludePatterns = [
        'node_modules/**',
        '.git/**',
        '.vibesec-temp.zip',
        '**/*.zip',
        'dist/**',
        'build/**',
        '.vscode/**',
        '**/.DS_Store'
      ];

      // Check for .gitignore and add its patterns
      const gitignorePath = path.join(sourcePath, '.gitignore');
      const gitignorePatterns = this.parseGitignore(gitignorePath);
      
      if (gitignorePatterns.length > 0) {
        console.log(`Found .gitignore with ${gitignorePatterns.length} patterns`);
        excludePatterns.push(...gitignorePatterns);
      }

      // Remove duplicates
      const uniquePatterns = [...new Set(excludePatterns)];
      console.log('Final exclusion patterns:', uniquePatterns);

      archive.glob('**/*', {
        cwd: sourcePath,
        ignore: uniquePatterns,
        dot: true
      });

      archive.finalize();
    });
  }

  private async handleFixVulnerability(vulnerability: any) {
    try {
      // Validate input
      if (!vulnerability.file || !vulnerability.fix || !vulnerability.lines) {
        throw new Error('Invalid vulnerability data: missing required fields');
      }

      await this.showNotification('fixVulnerability', `🔧 Fixing vulnerability in ${vulnerability.file}...`);
      
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error('No workspace folder open');
      }

      const filePath = path.join(
        workspaceFolders[0].uri.fsPath,
        vulnerability.file
      );

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${vulnerability.file}`);
      }

      const document = await vscode.workspace.openTextDocument(filePath);
      const edit = new vscode.WorkspaceEdit();

      // Parse line range more safely
      let startLine: number;
      let endLine: number;

      const linesStr = String(vulnerability.lines).trim();
      
      if (linesStr.includes('-')) {
        // Range format: "10-15"
        const parts = linesStr.split('-');
        if (parts.length !== 2) {
          throw new Error(`Invalid line range format: ${vulnerability.lines}`);
        }
        
        startLine = parseInt(parts[0].trim()) - 1;
        endLine = parseInt(parts[1].trim()) - 1;
        
        if (isNaN(startLine) || isNaN(endLine)) {
          throw new Error(`Invalid line numbers: ${vulnerability.lines}`);
        }
      } else {
        // Single line number: "10"
        const lineNum = parseInt(linesStr);
        if (isNaN(lineNum)) {
          throw new Error(`Invalid line number: ${vulnerability.lines}`);
        }
        startLine = lineNum - 1;
        endLine = startLine;
      }

      // Validate line numbers
      if (startLine < 0) {
        throw new Error(`Line number cannot be negative: ${startLine + 1}`);
      }
      if (endLine >= document.lineCount) {
        throw new Error(`Line number ${endLine + 1} exceeds file length (${document.lineCount} lines)`);
      }
      if (startLine > endLine) {
        throw new Error(`Invalid line range: start line ${startLine + 1} is after end line ${endLine + 1}`);
      }

      // Get original indentation from the first line
      const originalLine = document.lineAt(startLine).text;
      const indentationMatch = originalLine.match(/^\s*/);
      const indentation = indentationMatch ? indentationMatch[0] : '';

      const range = new vscode.Range(
        new vscode.Position(startLine, 0),
        new vscode.Position(endLine, document.lineAt(endLine).text.length)
      );

      // Convert escape sequences to actual characters
      let fixedCode = vulnerability.fix;
      
      // Replace common escape sequences
      fixedCode = fixedCode
        .replace(/\\n/g, '\n')      // newlines
        .replace(/\\t/g, '\t')      // tabs
        .replace(/\\r/g, '\r')      // carriage returns
        .replace(/\\"/g, '"')       // double quotes
        .replace(/\\'/g, "'")       // single quotes
        .replace(/\\\\/g, '\\');    // backslashes (do this last)
      
      // Check if fix needs indentation adjustment
      if (indentation) {
        const fixLines = fixedCode.split('\n');
        
        // Apply indentation to each line
        fixedCode = fixLines.map((line: string, index: number) => {
          // Don't indent empty lines
          if (line.trim() === '') {
            return line;
          }
          
          // For the first line, replace any existing leading whitespace with original indentation
          if (index === 0) {
            return indentation + line.trimStart();
          }
          
          // For subsequent lines, preserve their relative indentation
          return indentation + line;
        }).join('\n');
      }

      edit.replace(document.uri, range, fixedCode);

      const success = await vscode.workspace.applyEdit(edit);
      if (!success) {
        throw new Error('Failed to apply edit to document');
      }

      await document.save();

      await this.showNotification('fixVulnerability', `✅ Fix applied successfully to ${vulnerability.file}`);
      this._view?.webview.postMessage({
        type: 'fixSuccess',
        file: vulnerability.file
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to apply fix';
      console.error('Error in handleFixVulnerability:', errorMessage, error);
      
      await this.showNotification('fixVulnerability', `❌ Failed to apply fix: ${errorMessage}`, true);
      this._view?.webview.postMessage({
        type: 'fixError',
        error: errorMessage
      });
    }
  }

  private async handleFixAll(vulnerabilities: any[], filter: string) {
    try {
      if (!vulnerabilities || vulnerabilities.length === 0) {
        await this.showNotification('fixAll', '⚠️ No vulnerabilities to fix', true);
        return;
      }

      const filtered = vulnerabilities.filter(v => {
        if (filter === 'all') return true;
        if (filter === 'highCritical') {
          return v.severity === 'High' || v.severity === 'Critical';
        }
        if (filter === 'exploitable') {
          return v.exploitable === true;
        }
        return false;
      });

      if (filtered.length === 0) {
        await this.showNotification('fixAll', '⚠️ No vulnerabilities match the selected filter', true);
        return;
      }

      await this.showNotification('fixAll', `🔧 Applying ${filtered.length} fix${filtered.length !== 1 ? 'es' : ''}...`);

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (const vuln of filtered) {
        try {
          await this.handleFixVulnerability(vuln);
          successCount++;
        } catch (error) {
          failedCount++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${vuln.file}: ${errorMsg}`);
          console.error('Error fixing vulnerability:', vuln.file, error);
        }
      }

      const resultMessage = `✅ Applied ${successCount} of ${filtered.length} fix${filtered.length !== 1 ? 'es' : ''} successfully` +
        (failedCount > 0 ? ` (${failedCount} failed)` : '');

      await this.showNotification('fixAll', resultMessage);
      
      this._view?.webview.postMessage({
        type: 'fixAllSuccess',
        count: successCount,
        total: filtered.length,
        failed: failedCount,
        errors: errors
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to apply fixes';
      await this.showNotification('fixAll', `❌ Failed to apply fixes: ${errorMessage}`, true);
      this._view?.webview.postMessage({
        type: 'fixAllError',
        error: errorMessage
      });
    }
  }

  private async handleGetProfile(tokens: { access: string; refresh: string }) {
    try {
      await this.showNotification('profile', '👤 Loading profile...');
      const data = await this.makeAuthenticatedRequest(tokens, async (accessToken) => {
        const axios = require('axios');
        const response = await axios.get('http://localhost:3007/api/v1/profile', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        return response.data;
      });

      if (data.success) {
        await this.showNotification('profile', '✅ Profile loaded successfully');
        this._view?.webview.postMessage({
          type: 'profileSuccess',
          profile: data
        });
      } else {
        await this.showNotification('profile', '❌ Failed to load profile', true);
        this._view?.webview.postMessage({
          type: 'profileError',
          error: data.message || 'Failed to fetch profile'
        });
      }
    } catch (error: any) {
      await this.showNotification('profile', '❌ Failed to load profile', true);
      this._view?.webview.postMessage({
        type: 'profileError',
        error: error.message || 'Network error occurred'
      });
    }
  }

  public refresh() {
    if (this._view) {
      this._view.webview.html = this._getHtmlForWebview(this._view.webview);
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js')
    );

    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.css')
    );

    const iconUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'resources', 'icon.svg')
    );

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleUri}" rel="stylesheet">
        <title>VibeSec</title>
      </head>
      <body>
        <div id="app"></div>
        <script>
          window.ICON_URI = "${iconUri}";
        </script>
        <script src="${scriptUri}"></script>
      </body>
      </html>`;
  }
}

export function deactivate() {}