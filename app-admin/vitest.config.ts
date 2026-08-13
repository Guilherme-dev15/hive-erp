/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

import { viteCommonjs } from '@originjs/vite-plugin-commonjs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteCommonjs(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      devOptions: {
        enabled: true, // Permite testar o PWA em localhost
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000, // 5 MB
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
      manifest: {
        name: 'Hive ERP Admin',
        short_name: 'Hive Admin',
        description: 'Gestão Hive ERP',
        theme_color: '#343434',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable', // Importante para Android
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
  },
  define: {
    'import.meta.env': {
      VITE_FIREBASE_API_KEY: JSON.stringify('mock_api_key'),
      VITE_FIREBASE_AUTH_DOMAIN: JSON.stringify('mock_auth_domain'),
      VITE_FIREBASE_PROJECT_ID: JSON.stringify('mock_project_id'),
      VITE_FIREBASE_STORAGE_BUCKET: JSON.stringify('mock_storage_bucket'),
      VITE_FIREBASE_MESSAGING_SENDER_ID: JSON.stringify('mock_sender_id'),
      VITE_FIREBASE_APP_ID: JSON.stringify('mock_app_id'),
      VITE_API_URL: JSON.stringify('http://localhost:3001/api'),
    }
  }
});
