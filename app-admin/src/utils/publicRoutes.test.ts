import { describe, expect, it } from 'vitest';
import {
  getAdminAppUrl,
  isMarketingHost,
  resolvePublicSurface,
} from './publicRoutes';

describe('publicRoutes utils', () => {
  describe('isMarketingHost', () => {
    it('identifica hiveerp.com.br e www.hiveerp.com.br como hosts institucionais', () => {
      expect(isMarketingHost('hiveerp.com.br')).toBe(true);
      expect(isMarketingHost('www.hiveerp.com.br')).toBe(true);
      expect(isMarketingHost('HIVEERP.COM.BR')).toBe(true);
    });

    it('não classifica app.hiveerp.com.br, vercel.app ou localhost como host institucional', () => {
      expect(isMarketingHost('app.hiveerp.com.br')).toBe(false);
      expect(isMarketingHost('hive-erp.vercel.app')).toBe(false);
      expect(isMarketingHost('localhost')).toBe(false);
      expect(isMarketingHost('')).toBe(false);
    });
  });

  describe('resolvePublicSurface', () => {
    it('sempre resolve /termos e /privacidade para suas páginas legais em qualquer host', () => {
      expect(resolvePublicSurface('hiveerp.com.br', '/termos')).toBe('terms');
      expect(resolvePublicSurface('app.hiveerp.com.br', '/termos/')).toBe('terms');
      expect(resolvePublicSurface('localhost', '/privacidade')).toBe('privacy');
      expect(resolvePublicSurface('app.hiveerp.com.br', '/privacidade/lgpd')).toBe('privacy');
    });

    it('resolve /landing para landing em qualquer host', () => {
      expect(resolvePublicSurface('localhost', '/landing')).toBe('landing');
      expect(resolvePublicSurface('hive-erp.vercel.app', '/landing/')).toBe('landing');
    });

    it('resolve / para landing apenas no host institucional quando não está autenticado', () => {
      expect(resolvePublicSurface('hiveerp.com.br', '/')).toBe('landing');
      expect(resolvePublicSurface('www.hiveerp.com.br', '/')).toBe('landing');
      expect(resolvePublicSurface('app.hiveerp.com.br', '/')).toBe('app');
      expect(resolvePublicSurface('localhost', '/')).toBe('app');
      expect(resolvePublicSurface('hive-erp.vercel.app', '/')).toBe('app');
    });

    it('permite acessar o app diretamente em /admin, /entrar ou /login mesmo no host institucional', () => {
      expect(resolvePublicSurface('hiveerp.com.br', '/admin')).toBe('app');
      expect(resolvePublicSurface('hiveerp.com.br', '/entrar')).toBe('app');
      expect(resolvePublicSurface('hiveerp.com.br', '/login')).toBe('app');
    });
  });

  describe('getAdminAppUrl', () => {
    it('direciona para https://app.hiveerp.com.br a partir do domínio raiz de marketing', () => {
      expect(getAdminAppUrl('hiveerp.com.br')).toBe('https://app.hiveerp.com.br');
      expect(getAdminAppUrl('www.hiveerp.com.br')).toBe('https://app.hiveerp.com.br');
    });

    it('mantém rota local /admin em localhost ou preview vercel', () => {
      expect(getAdminAppUrl('localhost')).toBe('/admin');
      expect(getAdminAppUrl('hive-erp.vercel.app')).toBe('/admin');
    });
  });
});
