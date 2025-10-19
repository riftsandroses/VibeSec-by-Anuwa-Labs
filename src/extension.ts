import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import archiver from 'archiver';

export function activate(context: vscode.ExtensionContext) {
    const provider = new VibeSecViewProvider(context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            VibeSecViewProvider.viewType,
            provider
        )
    );
}

class VibeSecViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'vibesec.sidebarView';
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

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'runScan':
                    await this.handleSecurityScan(data.apiUrl, data.authToken);
                    break;
                case 'logout':
                    this.handleLogout();
                    break;
            }
        });
    }

    private async handleSecurityScan(apiUrl: string, authToken: string) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }

        const workspacePath = workspaceFolders[0].uri.fsPath;
        
        // Show progress
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "VibeSec: Creating workspace archive...",
            cancellable: false
        }, async (progress) => {
            try {
                // Create zip file
                const zipBuffer = await this.createWorkspaceZip(workspacePath);
                
                progress.report({ message: "Uploading to security server..." });
                
                // Send to API
                const result = await this.sendToAPI(zipBuffer, apiUrl, authToken);
                
                // Send results back to webview
                this._view?.webview.postMessage({
                    type: 'scanComplete',
                    data: result
                });
                
                vscode.window.showInformationMessage('Security scan completed successfully!');
            } catch (error) {
                vscode.window.showErrorMessage(`Scan failed: ${error}`);
                this._view?.webview.postMessage({
                    type: 'scanError',
                    error: String(error)
                });
            }
        });
    }

    private async createWorkspaceZip(workspacePath: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            const archive = archiver('zip', { zlib: { level: 9 } });

            archive.on('data', (chunk) => chunks.push(chunk));
            archive.on('end', () => resolve(Buffer.concat(chunks)));
            archive.on('error', reject);

            // Add files, excluding common ignore patterns
            archive.glob('**/*', {
                cwd: workspacePath,
                ignore: [
                    '**/node_modules/**',
                    '**/.git/**',
                    '**/dist/**',
                    '**/build/**',
                    '**/.vscode/**',
                    '**/*.zip'
                ]
            });

            archive.finalize();
        });
    }

    private async sendToAPI(zipBuffer: Buffer, apiUrl: string, authToken: string): Promise<any> {
        const FormData = require('form-data');
        const form = new FormData();
        form.append('file', zipBuffer, 'workspace.zip');

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: form
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }

        return await response.json();
    }

    private handleLogout() {
        this._view?.webview.postMessage({
            type: 'logoutComplete'
        });
        vscode.window.showInformationMessage('Logged out successfully');
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js')
        );
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.css')
        );

        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
                <link href="${styleUri}" rel="stylesheet">
                <title>VibeSec</title>
            </head>
            <body>
                <div id="app"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export function deactivate() {}