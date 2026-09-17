import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { IncomingMessage, ServerResponse } from 'node:http';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';

const allowedOrigins = () =>
  (process.env.ALLOWED_ORIGINS ||
    'https://hive-erp.vercel.app,https://hiveerp-catalogo.vercel.app')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

function isAllowedOrigin(origin: string | undefined): boolean {
  return !origin || allowedOrigins().includes(origin);
}

export function createCorsOptions() {
  return {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  };
}

export function getAllowedOrigins(): string[] {
  return allowedOrigins();
}

export function createRequestHandler(
  server: (req: IncomingMessage, res: ServerResponse) => void
): (req: IncomingMessage, res: ServerResponse) => void {
  return (req: IncomingMessage, res: ServerResponse): void => {
    server(req, res);
  };
}

export function resetServerCacheForTests(): void {
  cachedServer = undefined;
}

let cachedServer: ((req: IncomingMessage, res: ServerResponse) => void) | undefined;

async function bootstrap() {
  if (!cachedServer) {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });

    app.useLogger(app.get(Logger));

    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    // Configurando CORS seguro
    app.enableCors(createCorsOptions());

    await app.init();

    const expressApp = app.getHttpAdapter().getInstance();
    cachedServer = expressApp;
  }
  return cachedServer;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const server = await bootstrap();
  if (!server) {
    throw new Error('Nest server failed to initialize');
  }
  createRequestHandler(server)(req, res);
}
