import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import archiver from 'archiver';

export function activate(context: vscode.ExtensionContext) {
  const provider = new VibeSecViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'vibesec.sidebar',
      provider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vibesec.refresh', () => {
      provider.refresh();
    })
  );
}

class VibeSecViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
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

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'login':
          await this.handleLogin(data.credentials);
          break;
        case 'startSecurityTest':
          await this.handleSecurityTest(data.tokens);
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
      }
    });
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

  private async handleSecurityTest(tokens: { access: string; refresh: string }) {
    try {
      const axios = require('axios');
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

      await this.createZipFile(workspacePath, zipPath);

      // Read zip file as buffer
      const zipBuffer = fs.readFileSync(zipPath);

      // Create form data
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', zipBuffer, 'workspace.zip');

      const response = await axios.post('http://localhost:3007/api/v1/security-testing/', formData, {
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          ...formData.getHeaders()
        }
      });

      // Clean up temp file
      if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
      }

      const data = response.data;

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
      this._view?.webview.postMessage({
        type: 'securityTestError',
        error: error.response?.data?.message || error.message || 'Unknown error occurred'
      });
    }
  }

  private async createZipFile(sourcePath: string, outPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve());
      archive.on('error', (err) => reject(err));

      archive.pipe(output);
      archive.directory(sourcePath, false);
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

      // Parse line numbers (assuming format like "10-15")
      const lineRange = vulnerability.lines.split('-').map((n: string) => parseInt(n.trim()));
      const startLine = lineRange[0] - 1; // 0-indexed
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
      if (filter === 'reachable') {
        return v.reachability === 'Reachable';
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
      const axios = require('axios');
      
      const response = await axios.get('http://localhost:3007/api/v1/profile', {
        headers: {
          'Authorization': `Bearer ${tokens.access}`
        }
      });

      const data = response.data;

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
        error: error.response?.data?.message || error.message || 'Network error occurred'
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
        <script src="${scriptUri}"></script>
      </body>
      </html>`;
  }
}

export function deactivate() {}