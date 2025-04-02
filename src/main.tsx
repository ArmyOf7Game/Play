import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import WebApp from '@twa-dev/sdk';

WebApp.ready();
setTimeout(() => {

  window.Telegram.WebApp.expand();

}, 100);

const manifestUrl = 'https://monitoring-referenced-alias-casting.trycloudflare.com/tonconnect-manifest.json';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <TonConnectUIProvider manifestUrl={manifestUrl}>
          <App />
        </TonConnectUIProvider>
      </BrowserRouter>
    </ErrorBoundary> 
  </React.StrictMode>,
);

