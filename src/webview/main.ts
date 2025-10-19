// Tell TypeScript that VS Code provides this global function
declare function acquireVsCodeApi(): {
  postMessage: (message: any) => void;
  getState: () => any;
  setState: (state: any) => void;
};

(window as any).acquireVsCodeApi = acquireVsCodeApi;

import App from './App.svelte';
import './styles/global.css';

const app = new App({
  target: document.getElementById('app')!
});

export default app;