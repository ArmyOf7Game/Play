



import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import WebApp from '@twa-dev/sdk';
import { Buffer } from 'buffer';
window.Buffer = Buffer;

const baseUrl = import.meta.env.BASE_URL || '/Play/';

WebApp.ready();
setTimeout(() => {
  window.Telegram.WebApp.expand();
}, 100);

const manifestUrl = 'https://armyof7game.github.io/Play/tonconnect-manifest.json';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter basename={baseUrl}>
        <TonConnectUIProvider manifestUrl={manifestUrl}>
          <App />
        </TonConnectUIProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);