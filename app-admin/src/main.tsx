import React from 'react';
import ReactDOM from 'react-dom/client';
import * as AppModule from './App';
import './index.css';
import { Buffer } from 'buffer';

// Polyfill para Buffer, necessário para algumas dependências
declare global {
    interface Window {
        Buffer: typeof Buffer;
    }
}
window.Buffer = Buffer;

const App = AppModule.default || AppModule;

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
