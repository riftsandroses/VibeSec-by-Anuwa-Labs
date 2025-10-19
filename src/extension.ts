import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as archiver from 'archiver';

export function activate(context: vscode.ExtensionContext) {
    const provider = new VibeSacViewProvider(context.extensionUri, context);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(VibeSacViewProvider.viewType, provider)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('vibesec.runScan', async () => {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showErrorMessage('No workspace folder open');
                return;
            }

            const workspacePath = workspaceFolders[0].uri.fsPath;
            const zipPath = path.join(context.globalStorageUri.fsPath, 'workspace.zip');

            // Ensure storage directory exists
            if (!fs.existsSync(context.globalStorageUri.fsPath)) {
                fs.mkdirSync(context.globalStorageUri.fsPath, { recursive: true });
            }

            try {
                await createZipFile(workspacePath, zipPath);
                provider.sendMessage({ type: 'zipCreated', path: zipPath });
                vscode.window.showInformationMessage('Workspace zipped successfully');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to create zip: ${error}`);
                provider.sendMessage({ type: 'zipError', error: String(error) });
            }
        })
    );
}

async function createZipFile(sourceDir: string, outPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve());
        archive.on('error', (err) => reject(err));

        archive.pipe(output);

        // Add files, excluding common directories
        archive.glob('**/*', {
            cwd: sourceDir,
            ignore: [
                '**/node_modules/**',
                '**/.git/**',
                '**/dist/**',
                '**/build/**',
                '**/.vscode/**',
                '**/out/**'
            ]
        });

        archive.finalize();
    });
}

class VibeSacViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'vibesec.dashboardView';
    private _view?: vscode.WebviewView;
    private _context: vscode.ExtensionContext;

    constructor(private readonly _extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        this._context = context;
    }

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

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'runScan':
                    vscode.commands.executeCommand('vibesec.runScan');
                    break;
                case 'uploadZip':
                    await this.uploadZipToAPI(data.zipPath, data.token);
                    break;
                case 'saveAuth':
                    await this._context.globalState.update('authToken', data.token);
                    await this._context.globalState.update('userData', data.userData);
                    break;
                case 'getAuth':
                    const token = await this._context.globalState.get('authToken');
                    const userData = await this._context.globalState.get('userData');
                    this.sendMessage({ type: 'authData', token, userData });
                    break;
                case 'logout':
                    await this._context.globalState.update('authToken', undefined);
                    await this._context.globalState.update('userData', undefined);
                    break;
            }
        });
    }

    private async uploadZipToAPI(zipPath: string, token: string) {
        try {
            const fileBuffer = fs.readFileSync(zipPath);
            const formData = new FormData();
            const blob = new Blob([fileBuffer]);
            formData.append('file', blob, 'workspace.zip');

            const response = await fetch('YOUR_API_ENDPOINT/scan', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const result = await response.json();
            this.sendMessage({ type: 'scanComplete', data: result });
        } catch (error) {
            this.sendMessage({ type: 'scanError', error: String(error) });
        }
    }

    public sendMessage(message: any) {
        if (this._view) {
            this._view.webview.postMessage(message);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js')
        );

        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} https:; font-src ${webview.cspSource}; connect-src https:;">
                <title>VibeSec Dashboard</title>
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