import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const DEFAULT_ALLOWED_ORIGINS = [
  'https://hive-erp.vercel.app',
  'https://hiveerp-catalogo.vercel.app',
] as const;

export function parseAllowedOrigins(
  value: string | undefined,
  fallback: readonly string[] = DEFAULT_ALLOWED_ORIGINS
): string[] {
  if (value === undefined) {
    return [...fallback];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function createCorsOptions(
  allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS)
): CorsOptions {
  return {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, x-test-uid, Accept, Origin',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
}
