import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize theme and view mode from localStorage
const theme = localStorage.getItem('theme') || 'light';
const viewMode = localStorage.getItem('viewMode') || 'desktop';
document.documentElement.setAttribute('data-theme', theme);
document.documentElement.setAttribute('data-view-mode', viewMode);

const rootEl = document.getElementById('root');

if (!rootEl) {
  throw new Error('Root element #root not found');
}

try {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (err) {
  console.error('Failed to mount React app:', err);
  rootEl.innerHTML =
    '<div style="padding:2rem;font-family:system-ui,sans-serif;max-width:32rem;margin:0 auto">' +
    '<h1 style="color:#0056D2">SuCAR failed to start</h1>' +
    '<p>Refresh the page. If this persists, open DevTools (F12) → Console and share the error.</p>' +
    `<pre style="background:#f3f4f6;padding:1rem;overflow:auto;font-size:12px">${String(err)}</pre>` +
    '</div>';
}
