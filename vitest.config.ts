/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    env_file: './.env.test', // Carrega as variáveis de ambiente para teste
    setupFiles: './vitest.setup.ts',
  },
});
