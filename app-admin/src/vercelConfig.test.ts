import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

interface VercelRoute {
  src?: string;
  dest?: string;
  handle?: string;
  continue?: boolean;
  headers?: Record<string, string>;
}

interface VercelConfig {
  routes?: VercelRoute[];
  headers?: Array<{
    source: string;
    headers: Array<{ key: string; value: string }>;
  }>;
}

describe('vercel.json (COOP/COEP e roteamento Admin + API)', () => {
  const vercelConfigPath = path.resolve(__dirname, '../../vercel.json');
  const raw = fs.readFileSync(vercelConfigPath, 'utf8');
  const config = JSON.parse(raw) as VercelConfig;

  it('emite Cross-Origin-Opener-Policy e COEP após /api/(.*) e antes de handle: filesystem e rotas SPA', () => {
    const routes = config.routes ?? [];
    const apiRouteIndex = routes.findIndex((r) => r.src === '/api/(.*)');
    const filesystemIndex = routes.findIndex((r) => r.handle === 'filesystem');
    const rootRouteIndex = routes.findIndex((r) => r.src === '/');

    expect(apiRouteIndex).toBe(0);
    expect(filesystemIndex).toBeGreaterThan(-1);
    expect(rootRouteIndex).toBeGreaterThan(filesystemIndex);

    const coopRouteIndex = routes.findIndex(
      (r) =>
        r.continue === true &&
        r.headers?.['Cross-Origin-Opener-Policy'] === 'same-origin-allow-popups' &&
        r.headers?.['Cross-Origin-Embedder-Policy'] === 'unsafe-none',
    );

    expect(coopRouteIndex).toBeGreaterThan(apiRouteIndex);
    expect(coopRouteIndex).toBeLessThan(filesystemIndex);
    expect(coopRouteIndex).toBeLessThan(rootRouteIndex);

    // Garante que não há bloco top-level headers morto após routes
    expect(config.headers).toBeUndefined();

    // Valida correspondência do padrão da regra COOP para páginas do Admin
    const coopRegex = new RegExp(`^${routes[coopRouteIndex].src}$`);
    expect(coopRegex.test('/')).toBe(true);
    expect(coopRegex.test('/index.html')).toBe(true);
    expect(coopRegex.test('/admin')).toBe(true);
    expect(coopRegex.test('/assets/firebase-vendor.js')).toBe(true);
    expect(coopRegex.test('/api/v2/auth/me')).toBe(false);
  });

  it('preserva o roteamento serverless da API e fallback SPA do Admin', () => {
    const routes = config.routes ?? [];
    expect(routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: '/api/(.*)', dest: '/api/[...path]' }),
        expect.objectContaining({ src: '/admin(?:/.*)?', dest: '/index.html' }),
        expect.objectContaining({ src: '/', dest: '/index.html' }),
      ]),
    );
  });
});
