/**
 * Utilitário para geração de URLs do catálogo no painel administrativo.
 * Suporta subdomínios wildcard dinâmicos quando VITE_CATALOG_BASE_DOMAIN estiver configurado
 * (ex: https://pratas.meudominio.com.br) ou fallback padrão da Vercel (ex: https://hiveerp-catalogo.vercel.app/pratas).
 */

export function getCatalogUrl(slug?: string | null): string | null {
  if (!slug || !slug.trim()) return null;
  const cleanSlug = slug.trim().toLowerCase();

  const baseDomain = import.meta.env.VITE_CATALOG_BASE_DOMAIN as string | undefined;

  if (baseDomain && baseDomain.trim()) {
    const cleanBaseDomain = baseDomain.trim().replace(/^\.+/, '');
    return `https://${cleanSlug}.${cleanBaseDomain}`;
  }

  return `https://hiveerp-catalogo.vercel.app/${cleanSlug}`;
}

export function getCatalogDisplayUrl(slug?: string | null): string {
  const displaySlug = (slug || '').trim().toLowerCase() || 'sua-loja';
  const baseDomain = import.meta.env.VITE_CATALOG_BASE_DOMAIN as string | undefined;

  if (baseDomain && baseDomain.trim()) {
    const cleanBaseDomain = baseDomain.trim().replace(/^\.+/, '');
    return `${displaySlug}.${cleanBaseDomain}`;
  }

  return `hiveerp-catalogo.vercel.app/${displaySlug}`;
}
