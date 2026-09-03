import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    exclude: ['**/node_modules/**', '**/dist/**', 'src/setup.test.ts'],
    env: {
      VITE_FIREBASE_API_KEY: 'mock-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'mock-domain',
      VITE_FIREBASE_PROJECT_ID: 'mock-id',
      VITE_FIREBASE_STORAGE_BUCKET: 'mock-bucket',
      VITE_FIREBASE_MESSAGING_SENDER_ID: 'mock-sender',
      VITE_FIREBASE_APP_ID: 'mock-app-id'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
