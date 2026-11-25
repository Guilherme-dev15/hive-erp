export type PublicSurface = 'landing' | 'terms' | 'privacy' | 'app';

const MARKETING_HOSTS = new Set(['hiveerp.com.br', 'www.hiveerp.com.br']);

export function isMarketingHost(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  return MARKETING_HOSTS.has(normalized);
}

export function resolvePublicSurface(hostname: string, pathname: string): PublicSurface {
  const path = (pathname || '/').trim().toLowerCase();

  if (path === '/termos' || path.startsWith('/termos/')) {
    return 'terms';
  }

  if (path === '/privacidade' || path.startsWith('/privacidade/')) {
    return 'privacy';
  }

  if (path === '/landing' || path.startsWith('/landing/')) {
    return 'landing';
  }

  if (
    path === '/admin' ||
    path.startsWith('/admin/') ||
    path === '/entrar' ||
    path.startsWith('/entrar/') ||
    path === '/login' ||
    path.startsWith('/login/')
  ) {
    return 'app';
  }

  if (isMarketingHost(hostname) && (path === '/' || path === '')) {
    return 'landing';
  }

  return 'app';
}

export function getAdminAppUrl(hostname: string): string {
  if (isMarketingHost(hostname)) {
    return 'https://app.hiveerp.com.br';
  }
  return '/admin';
}
