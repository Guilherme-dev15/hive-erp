import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import serverlessExpress from '@vendia/serverless-express';
import { Handler, Context, Callback } from 'aws-lambda';
import { Logger } from 'nestjs-pino';
import { createCorsOptions, parseAllowedOrigins } from './config/cors';

let cachedServer: Handler;

async function bootstrap() {
  if (!cachedServer) {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });

    app.useLogger(app.get(Logger));

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );

    app.enableCors(
      createCorsOptions(parseAllowedOrigins(process.env.ALLOWED_ORIGINS))
    );

    await app.init();

    const expressApp = app.getHttpAdapter().getInstance();
    cachedServer = serverlessExpress({ app: expressApp });
  }
  return cachedServer;
}

export default async function handler(
  event: any,
  context: Context,
  callback: Callback
) {
  const server = await bootstrap();
  return server(event, context, callback);
}
