import { describe, it, expect } from 'vitest';
import {
  extractSlugFromLocation,
  RESERVED_SUBDOMAINS,
} from './storeIdentity';

describe('extractSlugFromLocation', () => {
  describe('Subdomínios com TLD composto (.com.br)', () => {
    it('deve extrair o slug de um subdomínio válido (ex: pratas.meudominio.com.br)', () => {
      const result = extractSlugFromLocation({
        hostname: 'pratas.meudominio.com.br',
        pathname: '/',
      });

      expect(result).toEqual({
        slug: 'pratas',
        isSubdomain: true,
      });
    });

    it('NÃO deve tratar o domínio apex .com.br como slug de loja', () => {
      const result = extractSlugFromLocation({
        hostname: 'meudominio.com.br',
        pathname: '/',
      });

      expect(result).toEqual({
        slug: null,
        isSubdomain: false,
      });
    });

    it('NÃO deve tratar subdomínio www como slug de loja', () => {
      const result = extractSlugFromLocation({
        hostname: 'www.meudominio.com.br',
        pathname: '/',
      });

      expect(result).toEqual({
        slug: null,
        isSubdomain: false,
      });
    });

    it('NÃO deve tratar subdomínios reservados do sistema como slug de loja', () => {
      for (const reserved of Array.from(RESERVED_SUBDOMAINS)) {
        const result = extractSlugFromLocation({
          hostname: `${reserved}.meudominio.com.br`,
          pathname: '/',
        });
        expect(result.slug).toBeNull();
        expect(result.isSubdomain).toBe(false);
      }
    });
  });

  describe('Subdomínios com TLD simples (.com, .store, etc.)', () => {
    it('deve extrair o slug de um subdomínio simples (ex: pratas.meudominio.com)', () => {
      const result = extractSlugFromLocation({
        hostname: 'pratas.meudominio.com',
        pathname: '/',
      });

      expect(result).toEqual({
        slug: 'pratas',
        isSubdomain: true,
      });
    });

    it('NÃO deve tratar o domínio apex .com como slug de loja', () => {
      const result = extractSlugFromLocation({
        hostname: 'meudominio.com',
        pathname: '/',
      });

      expect(result).toEqual({
        slug: null,
        isSubdomain: false,
      });
    });
  });

  describe('Ambiente de Desenvolvimento Local (localhost)', () => {
    it('deve extrair slug quando acessado via subdomínio local (ex: pratas.localhost)', () => {
      const result = extractSlugFromLocation({
        hostname: 'pratas.localhost',
        pathname: '/',
      });

      expect(result).toEqual({
        slug: 'pratas',
        isSubdomain: true,
      });
    });

    it('NÃO deve extrair slug do localhost simples', () => {
      const result = extractSlugFromLocation({
        hostname: 'localhost',
        pathname: '/',
      });

      expect(result).toEqual({
        slug: null,
        isSubdomain: false,
      });
    });

    it('NÃO deve extrair slug do 127.0.0.1', () => {
      const result = extractSlugFromLocation({
        hostname: '127.0.0.1',
        pathname: '/',
      });

      expect(result).toEqual({
        slug: null,
        isSubdomain: false,
      });
    });
  });

  describe('Vercel Shared Domain (vercel.app)', () => {
    it('deve resolver slug pelo path no domínio compartilhado vercel.app', () => {
      const result = extractSlugFromLocation({
        hostname: 'hiveerp-catalogo.vercel.app',
        pathname: '/pratas',
      });

      expect(result).toEqual({
        slug: 'pratas',
        isSubdomain: false,
      });
    });

    it('deve resolver slug por query string ?loja= no vercel.app', () => {
      const result = extractSlugFromLocation({
        hostname: 'hiveerp-catalogo.vercel.app',
        pathname: '/',
        search: '?loja=pratas',
      });

      expect(result).toEqual({
        slug: 'pratas',
        isSubdomain: false,
      });
    });

    it('deve retornar null se vercel.app for acessado sem path ou query', () => {
      const result = extractSlugFromLocation({
        hostname: 'hiveerp-catalogo.vercel.app',
        pathname: '/',
      });

      expect(result).toEqual({
        slug: null,
        isSubdomain: false,
      });
    });
  });

  describe('Configuração com Domínio Base Explícito', () => {
    it('deve extrair subdomínio com base no domínio base fornecido', () => {
      const result = extractSlugFromLocation(
        {
          hostname: 'ouro.minhaplataforma.com.br',
          pathname: '/',
        },
        'minhaplataforma.com.br'
      );

      expect(result).toEqual({
        slug: 'ouro',
        isSubdomain: true,
      });
    });

    it('deve ignorar domínio apex da plataforma mesmo com domínio base configurado', () => {
      const result = extractSlugFromLocation(
        {
          hostname: 'minhaplataforma.com.br',
          pathname: '/',
        },
        'minhaplataforma.com.br'
      );

      expect(result).toEqual({
        slug: null,
        isSubdomain: false,
      });
    });
  });

  describe('Segurança Multitenant & Prevalência', () => {
    it('o subdomínio deve prevalecer e ignorar tentativas de sobrescrita via query param', () => {
      const result = extractSlugFromLocation({
        hostname: 'loja1.meudominio.com.br',
        pathname: '/',
        search: '?loja=loja2',
      });

      expect(result).toEqual({
        slug: 'loja1',
        isSubdomain: true,
      });
    });

    it('deve ignorar rotas de sistema no path', () => {
      const rotas = ['/assets/main.js', '/api/v1/health', '/manifest.json', '/favicon.ico', '/robots.txt'];

      for (const rota of rotas) {
        const result = extractSlugFromLocation({
          hostname: 'hiveerp-catalogo.vercel.app',
          pathname: rota,
        });

        expect(result.slug).toBeNull();
      }
    });

    it('deve retornar null se directStoreId for fornecido sem querySlug (legado)', () => {
      const result = extractSlugFromLocation({
        hostname: 'localhost',
        pathname: '/',
        search: '?storeId=some-id',
      });

      expect(result).toEqual({
        slug: null,
        isSubdomain: false,
      });
    });
  });
});
