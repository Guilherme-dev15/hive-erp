/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals: true,
    include: ['api/__tests__/**/*.test.js', 'api/src/services/__tests__/**/*.test.js'],
    environment: 'node',
  },
});
