export type Pagina =
  | 'dashboard'
  | 'pedidos'
  | 'produtos'
  | 'fornecedores'
  | 'financeiro'
  | 'campanhas'
  | 'cupons'
  | 'precificacao'
  | 'relatorios'
  | 'equipe'
  | 'configuracoes';

const PATH_BY_PAGE: Record<Pagina, string> = {
  dashboard: '/admin',
  pedidos: '/admin/pedidos',
  produtos: '/admin/produtos',
  fornecedores: '/admin/fornecedores',
  financeiro: '/admin/financeiro',
  campanhas: '/admin/campanhas',
  cupons: '/admin/cupons',
  precificacao: '/admin/precificacao',
  relatorios: '/admin/relatorios',
  equipe: '/admin/equipe',
  configuracoes: '/admin/configuracoes',
};

const PAGE_BY_PATH: Record<string, Pagina> = {
  '/': 'dashboard',
  '/admin': 'dashboard',
  '/admin/pedidos': 'pedidos',
  '/admin/produtos': 'produtos',
  '/admin/fornecedores': 'fornecedores',
  '/admin/financeiro': 'financeiro',
  '/admin/campanhas': 'campanhas',
  '/admin/cupons': 'cupons',
  '/admin/precificacao': 'precificacao',
  '/admin/relatorios': 'relatorios',
  '/admin/equipe': 'equipe',
  '/admin/configuracoes': 'configuracoes',
};

function normalizePathname(pathname: string): string {
  const normalized = pathname.replace(/\/+$/, '');
  return normalized || '/';
}

export function pathFromPage(page: Pagina): string {
  return PATH_BY_PAGE[page];
}

export function pageFromPath(pathname: string): Pagina {
  return PAGE_BY_PATH[normalizePathname(pathname)] ?? 'dashboard';
}

export function isKnownPagePath(pathname: string): boolean {
  return normalizePathname(pathname) in PAGE_BY_PATH;
}

export function canonicalPathFromPath(pathname: string): string {
  const normalized = normalizePathname(pathname);
  return normalized === '/' ? '/' : pathFromPage(pageFromPath(normalized));
}
