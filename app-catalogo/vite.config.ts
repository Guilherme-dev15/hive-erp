import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Loja Virtual', // Nome que aparece na instalação
        short_name: 'Loja',
        description: 'Catálogo de Produtos',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone', // Remove a barra de endereços (parece app nativa)
        icons: [
          {
            src: 'pwa-192x192.png', // Você precisará adicionar esta imagem
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // E esta também
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
});