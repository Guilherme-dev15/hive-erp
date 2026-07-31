/// <reference types="vite-plugin-pwa/client" />
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // Importa o seu App principal
import './index.css';
// --- PWA (Service Worker) ---
import { registerSW } from 'virtual:pwa-register';
var updateSW = registerSW({
    onNeedRefresh: function () {
        if (confirm('Nova versão disponível. Atualizar?')) {
            updateSW(true);
        }
    },
    onOfflineReady: function () {
        console.log('App pronto para funcionar offline');
    },
});
// --- AQUI ESTAVA FALTANDO: INICIALIZAÇÃO DO REACT ---
var rootElement = document.getElementById('root');
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(<React.StrictMode>
      <App />
    </React.StrictMode>);
}
else {
    console.error("❌ ERRO CRÍTICO: Não encontrei a div com id 'root' no index.html");
}
