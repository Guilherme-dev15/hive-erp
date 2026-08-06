/// <reference types="vitest" />
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    include: ['api/__tests__/**/*.test.js', 'api/src/services/__tests__/**/*.test.js'],
    environment: 'node',
    setupFiles: ['./api/__tests__/patch.cjs'],
    server: {
      deps: {
        // Força o Vitest a usar o resolvedor do Vite para esses módulos,
        // permitindo que o 'alias' funcione mesmo em arquivos CommonJS.
        inline: ['firebase-admin'],
      },
    },
  },
  // --- A CORREÇÃO ---
  // Esta seção diz ao Vitest: "Sempre que o código pedir 'firebase-admin',
  // redirecione para o nosso arquivo de mock local em vez do pacote real em node_modules."
  resolve: {
    alias: {
      'firebase-admin': path.resolve(__dirname, 'api/__mocks__/firebase-admin.cjs'),
    },
  },
});
