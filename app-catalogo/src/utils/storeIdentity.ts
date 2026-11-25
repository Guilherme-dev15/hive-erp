/**
 * Utilitário para identificação de loja e tenant a partir da URL.
 * Suporta:
 * 1. Subdomínios Wildcard em TLDs compostos (ex: loja.meudominio.com.br)
 * 2. Subdomínios Wildcard em TLDs simples (ex: loja.meudominio.com)
 * 3. Subdomínios locais para desenvolvimento (ex: loja.localhost)
 * 4. Domínio base explícito (via VITE_CATALOG_BASE_DOMAIN)
 * 5. Proteção contra falsos positivos em apex domains (meudominio.com.br)
 * 6. Proteção contra subdomínios reservados (www, app, admin, api, etc.)
 * 7. Fallback seguro para Clean Path (/loja) e Query String (?loja=loja)
 */

export const RESERVED_SUBDOMAINS = new Set([
  'www',
  'app',
  'admin',
  'catalogo',
  'catalog',
  'api',
  'mail',
  'smtp',
  'pop',
  'imap',
  'ftp',
  'status',
  'portal',
  'sistema',
  'erp',
  'loja',
  'lojas',
  'static',
  'assets',
  'cdn',
  'staging',
  'preview',
  'dev',
  'test',
]);

export const SYSTEM_PATH_SEGMENTS = new Set([
  'api',
  'assets',
  'sw.js',
  'manifest.webmanifest',
  'manifest.json',
  'favicon.ico',
  'robots.txt',
]);

const COMPOUND_TLDS = [
  '.com.br',
  '.net.br',
  '.org.br',
  '.edu.br',
  '.gov.br',
  '.ind.br',
  '.co.uk',
  '.com.ar',
  '.com.mx',
  '.com.uy',
];

export interface LocationInput {
  hostname: string;
  pathname?: string;
  search?: string;
}

export interface StoreIdentityResult {
  slug: string | null;
  isSubdomain: boolean;
}

export function extractSlugFromLocation(
  location: LocationInput,
  configuredBaseDomain?: string
): StoreIdentityResult {
  const { hostname, pathname = '/', search = '' } = location;
  const host = (hostname || '').toLowerCase().trim();
  const searchParams = new URLSearchParams(search);
  const querySlug = searchParams.get('loja') || searchParams.get('slug');
  const directStoreId = searchParams.get('storeId');

  // 1. Se tem storeId direto sem querySlug (legado)
  if (directStoreId && !querySlug) {
    return { slug: null, isSubdomain: false };
  }

  // 2. Extração de subdomínio
  let extractedSubdomain: string | null = null;

  // 2.1 Se baseDomain explícito foi configurado
  if (configuredBaseDomain) {
    const base = configuredBaseDomain.toLowerCase().trim().replace(/^\.+/, '');
    if (host.endsWith(`.${base}`)) {
      const prefix = host.slice(0, -(base.length + 1));
      const sub = prefix.split('.')[0];
      if (sub && !RESERVED_SUBDOMAINS.has(sub)) {
        extractedSubdomain = sub;
      }
    }
  }

  // 2.2 Detecção automática dinâmica se não extraiu via baseDomain explícito
  if (!extractedSubdomain) {
    // 2.2.1 Suporte a desenvolvimento local (ex: loja.localhost)
    if (host.endsWith('.localhost')) {
      const parts = host.split('.');
      if (parts.length >= 2) {
        const sub = parts[0];
        if (sub && !RESERVED_SUBDOMAINS.has(sub)) {
          extractedSubdomain = sub;
        }
      }
    } else if (
      host !== 'localhost' &&
      !host.includes('127.0.0.1') &&
      !host.includes('vercel.app')
    ) {
      // 2.2.2 Domínios normais na internet
      const compoundTld = COMPOUND_TLDS.find((tld) => host.endsWith(tld));
      const parts = host.split('.');

      if (compoundTld) {
        // Ex: loja.meudominio.com.br -> 4 partes: ['loja', 'meudominio', 'com', 'br']
        // Apex: meudominio.com.br -> 3 partes: ['meudominio', 'com', 'br']
        if (parts.length >= 4) {
          const sub = parts[0];
          if (sub && !RESERVED_SUBDOMAINS.has(sub)) {
            extractedSubdomain = sub;
          }
        }
      } else {
        // TLD simples (ex: loja.meudominio.com -> 3 partes: ['loja', 'meudominio', 'com'])
        // Apex: meudominio.com -> 2 partes: ['meudominio', 'com']
        if (parts.length >= 3) {
          const sub = parts[0];
          if (sub && !RESERVED_SUBDOMAINS.has(sub)) {
            extractedSubdomain = sub;
          }
        }
      }
    }
  }

  // Se detectou um subdomínio válido de loja, este tem precedência máxima (imutabilidade do tenant)
  if (extractedSubdomain) {
    return {
      slug: extractedSubdomain.toLowerCase(),
      isSubdomain: true,
    };
  }

  // 3. Fallback: Query param (?loja=slug ou ?slug=slug)
  if (querySlug) {
    const trimmed = querySlug.trim().toLowerCase();
    if (trimmed && !RESERVED_SUBDOMAINS.has(trimmed)) {
      return {
        slug: trimmed,
        isSubdomain: false,
      };
    }
  }

  // 4. Fallback: Clean Path URL (ex: hiveerp-catalogo.vercel.app/loja-da-maria)
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '');
  const firstSegment = cleanPath.split('/')[0]?.toLowerCase();

  if (
    firstSegment &&
    !firstSegment.includes('.') &&
    !SYSTEM_PATH_SEGMENTS.has(firstSegment) &&
    !RESERVED_SUBDOMAINS.has(firstSegment)
  ) {
    return {
      slug: firstSegment,
      isSubdomain: false,
    };
  }

  return { slug: null, isSubdomain: false };
}
