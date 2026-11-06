import { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Valida se um origin HTTP atende às regras de origens permitidas,
 * com suporte a correspondência exata e curingas (wildcards como https://*.meudominio.com.br).
 */
export function isOriginAllowed(
  origin: string | undefined,
  allowedOrigins: string[]
): boolean {
  if (!origin || !origin.trim()) return true;

  const normalizedOrigin = origin.trim().toLowerCase();

  for (const pattern of allowedOrigins) {
    const trimmedPattern = pattern.trim().toLowerCase();
    if (!trimmedPattern) continue;

    // Correspondência exata
    if (normalizedOrigin === trimmedPattern) {
      return true;
    }

    // Correspondência com wildcard (*)
    if (trimmedPattern.includes('*')) {
      // Escapa caracteres especiais de regex e substitui * por [a-z0-9-]+
      const regexStr =
        '^' +
        trimmedPattern
          .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
          .replace(/\*/g, '[a-z0-9-]+') +
        '$';

      try {
        const regex = new RegExp(regexStr);
        if (regex.test(normalizedOrigin)) {
          return true;
        }
      } catch {
        // Se o regex for malformado, ignora a regra
      }
    }
  }

  return false;
}

export function createCorsPreflightHandler(allowedOrigins: string[]) {
  return (req: IncomingMessage, res: ServerResponse): boolean => {
    if (req.method !== 'OPTIONS') return false;

    const origin = req.headers.origin;
    if (!origin || !isOriginAllowed(origin, allowedOrigins)) return false;

    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      req.headers['access-control-request-headers'] ?? 'Content-Type, Authorization',
    );
    res.setHeader('Vary', 'Origin');
    res.end();
    return true;
  };
}
