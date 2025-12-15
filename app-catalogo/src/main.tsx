/// <reference types="vite-plugin-pwa/client" />

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // Importa o seu App principal
import './index.css'

// --- PWA (Service Worker) ---
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Nova versão disponível. Atualizar?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App pronto para funcionar offline');
  },
})

// --- AQUI ESTAVA FALTANDO: INICIALIZAÇÃO DO REACT ---
const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} else {
  console.error("❌ ERRO CRÍTICO: Não encontrei a div com id 'root' no index.html");
}