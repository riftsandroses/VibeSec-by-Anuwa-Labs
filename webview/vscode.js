let vscode;

try {
  vscode = acquireVsCodeApi();
} catch (err) {
  console.warn('VS Code API not available (maybe running in browser preview)');
  vscode = {
    postMessage: (msg) => console.log('Mock postMessage:', msg),
    setState: () => {},
    getState: () => ({}),
  };
}

export default vscode;