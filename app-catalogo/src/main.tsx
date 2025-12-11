 
/// <reference types="vite-plugin-pwa/client" />

import './index.css'

// --- ADICIONE ISTO ---
import { registerSW } from 'virtual:pwa-register'

// Regista o Service Worker para cache e funcionamento offline
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