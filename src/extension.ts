import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import archiver from 'archiver';

const TOKEN_ACCESS_KEY = 'vibesec.token.access';
const TOKEN_REFRESH_KEY = 'vibesec.token.refresh';

export function activate(context: vscode.ExtensionContext) {
  const provider = new VibeSecViewProvider(context.extensionUri, context.secrets);

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
    private readonly _secrets: vscode.SecretStorage
  ) {}

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
      this._view?.webview.postMessage({
        type: 'logoutSuccess'
      });
    } catch (error) {
      console.error('Logout error:', error);
      await this.clearTokens();
      this._view?.webview.postMessage({
        type: 'logoutSuccess'
      });
    }
  }

  private async handleLogin(credentials: { username: string; password: string }) {
    try {
      const axios = require('axios');
      
      const response = await axios.post('http://localhost:3007/api/v1/login', credentials, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;

      if (data.success && data.access) {
        await this.saveTokens(data.access, data.refresh);

        this._view?.webview.postMessage({
          type: 'loginSuccess',
          tokens: {
            access: data.access,
            refresh: data.refresh
          }
        });
      } else {
        this._view?.webview.postMessage({
          type: 'loginError',
          error: data.message || 'Login failed'
        });
      }
    } catch (error: any) {
      this._view?.webview.postMessage({
        type: 'loginError',
        error: error.response?.data?.message || error.message || 'Network error occurred'
      });
    }
  }

  private async handleGetDashboard(tokens: { access: string; refresh: string }) {
    try {
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
        this._view?.webview.postMessage({
          type: 'dashboardSuccess',
          dashboard: data
        });
      } else {
        this._view?.webview.postMessage({
          type: 'dashboardError',
          error: data.message || 'Failed to fetch dashboard'
        });
      }
    } catch (error: any) {
      this._view?.webview.postMessage({
        type: 'dashboardError',
        error: error.message || 'Network error occurred'
      });
    }
  }

  private async handleSecurityTest(tokens: { access: string; refresh: string }) {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      
      if (!workspaceFolders || workspaceFolders.length === 0) {
        this._view?.webview.postMessage({
          type: 'securityTestError',
          error: 'No workspace folder open'
        });
        return;
      }

      const workspacePath = workspaceFolders[0].uri.fsPath;
      const zipPath = path.join(workspacePath, '.vibesec-temp.zip');

      // Create zip file of workspace
      await this.createZipFile(workspacePath, zipPath);
      
      // Read the zip file
      const zipBuffer = fs.readFileSync(zipPath);

      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', zipBuffer, 'workspace.zip');

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
        this._view?.webview.postMessage({
          type: 'securityTestSuccess',
          results: data
        });
      } else {
        this._view?.webview.postMessage({
          type: 'securityTestError',
          error: data.message || 'Security test failed'
        });
      }
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

      this._view?.webview.postMessage({
        type: 'securityTestError',
        error: error.message || 'Unknown error occurred'
      });
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

      // Add all files and folders from workspace
      // Exclude common directories that shouldn't be scanned
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

      archive.glob('**/*', {
        cwd: sourcePath,
        ignore: excludePatterns,
        dot: true // Include hidden files
      });

      archive.finalize();
    });
  }

  private async handleFixVulnerability(vulnerability: any) {
    try {
      const filePath = path.join(
        vscode.workspace.workspaceFolders![0].uri.fsPath,
        vulnerability.file
      );

      const document = await vscode.workspace.openTextDocument(filePath);
      const edit = new vscode.WorkspaceEdit();

      const lineRange = vulnerability.lines.split('-').map((n: string) => parseInt(n.trim()));
      const startLine = lineRange[0] - 1;
      const endLine = lineRange.length > 1 ? lineRange[1] - 1 : startLine;

      const range = new vscode.Range(
        new vscode.Position(startLine, 0),
        new vscode.Position(endLine, document.lineAt(endLine).text.length)
      );

      edit.replace(document.uri, range, vulnerability.fix);

      await vscode.workspace.applyEdit(edit);
      await document.save();

      this._view?.webview.postMessage({
        type: 'fixSuccess',
        file: vulnerability.file
      });
    } catch (error) {
      this._view?.webview.postMessage({
        type: 'fixError',
        error: error instanceof Error ? error.message : 'Failed to apply fix'
      });
    }
  }

  private async handleFixAll(vulnerabilities: any[], filter: string) {
    const filtered = vulnerabilities.filter(v => {
      if (filter === 'all') return true;
      if (filter === 'highCritical') {
        return v.severity === 'High' || v.severity === 'Critical';
      }
      if (filter === 'exploitable') {
        return v.exploitability === 'Exploitable';
      }
      return false;
    });

    for (const vuln of filtered) {
      await this.handleFixVulnerability(vuln);
    }

    this._view?.webview.postMessage({
      type: 'fixAllSuccess',
      count: filtered.length
    });
  }

  private async handleGetProfile(tokens: { access: string; refresh: string }) {
    try {
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
        this._view?.webview.postMessage({
          type: 'profileSuccess',
          profile: data
        });
      } else {
        this._view?.webview.postMessage({
          type: 'profileError',
          error: data.message || 'Failed to fetch profile'
        });
      }
    } catch (error: any) {
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