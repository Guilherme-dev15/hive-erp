import React from 'react';
import ReactDOM from 'react-dom/client';
import * as AppModule from './App'; // .tsx é implícito agora
const App = (AppModule as any).default || AppModule;
import './index.css';
import { Buffer } from 'buffer';

// Polyfill para Buffer, necessário para algumas dependências
(window as any).Buffer = Buffer;

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
