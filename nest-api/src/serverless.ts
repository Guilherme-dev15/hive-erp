import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { IncomingMessage, ServerResponse } from 'node:http';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';

let cachedServer: (req: IncomingMessage, res: ServerResponse) => void;

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
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
      : [
          'https://hive-erp.vercel.app',
          'https://hiveerp-catalogo.vercel.app'
        ];

    app.enableCors({
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Permitimos ausência de origin (ex: chamadas Server-to-Server ou curl), ou origins homologados
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: true,
    });

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
  server(req, res);
}
