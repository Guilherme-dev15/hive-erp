import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getCatalogUrl, getCatalogDisplayUrl } from './catalogUrl';

describe('catalogUrl utils', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('getCatalogUrl', () => {
    it('deve retornar null se slug não for fornecido ou for vazio', () => {
      expect(getCatalogUrl(null)).toBeNull();
      expect(getCatalogUrl(undefined)).toBeNull();
      expect(getCatalogUrl('')).toBeNull();
      expect(getCatalogUrl('   ')).toBeNull();
    });

    it('deve retornar URL com path fallback da Vercel quando VITE_CATALOG_BASE_DOMAIN não estiver definido', () => {
      vi.stubEnv('VITE_CATALOG_BASE_DOMAIN', '');
      expect(getCatalogUrl('pratas')).toBe('https://hiveerp-catalogo.vercel.app/pratas');
    });

    it('deve retornar URL com subdomínio wildcard quando VITE_CATALOG_BASE_DOMAIN estiver configurado', () => {
      vi.stubEnv('VITE_CATALOG_BASE_DOMAIN', 'meudominio.com.br');
      expect(getCatalogUrl('pratas')).toBe('https://pratas.meudominio.com.br');
    });

    it('deve limpar pontos no início do domínio base se configurado com . prefixado', () => {
      vi.stubEnv('VITE_CATALOG_BASE_DOMAIN', '.meudominio.com.br');
      expect(getCatalogUrl('joias')).toBe('https://joias.meudominio.com.br');
    });

    it('deve normalizar slug para minúsculas', () => {
      vi.stubEnv('VITE_CATALOG_BASE_DOMAIN', 'meudominio.com.br');
      expect(getCatalogUrl('Pratas-Vip')).toBe('https://pratas-vip.meudominio.com.br');
    });
  });

  describe('getCatalogDisplayUrl', () => {
    it('deve retornar exibição da Vercel quando VITE_CATALOG_BASE_DOMAIN não estiver configurado', () => {
      vi.stubEnv('VITE_CATALOG_BASE_DOMAIN', '');
      expect(getCatalogDisplayUrl('pratas')).toBe('hiveerp-catalogo.vercel.app/pratas');
      expect(getCatalogDisplayUrl('')).toBe('hiveerp-catalogo.vercel.app/sua-loja');
    });

    it('deve retornar exibição com subdomínio quando VITE_CATALOG_BASE_DOMAIN estiver configurado', () => {
      vi.stubEnv('VITE_CATALOG_BASE_DOMAIN', 'meudominio.com.br');
      expect(getCatalogDisplayUrl('pratas')).toBe('pratas.meudominio.com.br');
      expect(getCatalogDisplayUrl('')).toBe('sua-loja.meudominio.com.br');
    });
  });
});
