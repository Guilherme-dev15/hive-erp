import { IncomingMessage, ServerResponse } from 'node:http';

export function createCorsPreflightHandler(allowedOrigins: string[]) {
  return (req: IncomingMessage, res: ServerResponse): boolean => {
    if (req.method !== 'OPTIONS') return false;

    const origin = req.headers.origin;
    if (!origin || !allowedOrigins.includes(origin)) return false;

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
