import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import serverlessExpress from '@vendia/serverless-express';
import { Handler, Context, Callback } from 'aws-lambda';
import { Logger } from 'nestjs-pino';

let cachedServer: Handler;

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
      ? process.env.ALLOWED_ORIGINS.split(',')
      : [
          'https://hive-erp.vercel.app', 
          'https://hiveerp-catalogo.vercel.app'
        ];

    app.enableCors({
      origin: (origin, callback) => {
        // Permitimos ausência de origin (ex: chamadas Server-to-Server ou curl), ou origins homologados
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      preflightContinue: true,
      optionsSuccessStatus: 204,
      credentials: true,
    });

    await app.init();

    const expressApp = app.getHttpAdapter().getInstance();
    cachedServer = serverlessExpress({ app: expressApp });
  }
  return cachedServer;
}

export default async function handler(event: any, context: Context, callback: Callback) {
  const server = await bootstrap();
  return server(event, context, callback);
}
