import { describe, expect, it } from 'vitest';
import {
  isKnownPagePath,
  pageFromPath,
  pathFromPage,
} from './routing';

describe('rotas do painel administrativo', () => {
  it('resolve uma URL de produtos para a página correta', () => {
    expect(pageFromPath('/admin/produtos')).toBe('produtos');
    expect(pageFromPath('/admin/produtos/')).toBe('produtos');
  });

  it('mantém dashboard como página canônica da raiz e de /admin', () => {
    expect(pageFromPath('/')).toBe('dashboard');
    expect(pageFromPath('/admin')).toBe('dashboard');
    expect(pathFromPage('dashboard')).toBe('/admin');
  });

  it('converte todas as páginas do menu para caminhos administrativos', () => {
    expect(pathFromPage('relatorios')).toBe('/admin/relatorios');
    expect(pathFromPage('configuracoes')).toBe('/admin/configuracoes');
  });

  it('usa dashboard para caminhos desconhecidos e os identifica para canonicalização', () => {
    expect(pageFromPath('/admin/inexistente')).toBe('dashboard');
    expect(isKnownPagePath('/admin/inexistente')).toBe(false);
    expect(isKnownPagePath('/admin/produtos')).toBe(true);
  });
});
