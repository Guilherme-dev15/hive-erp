import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { createCorsOptions, parseAllowedOrigins } from './config/cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,
    transform: true,
  }));

  app.enableCors(
    createCorsOptions(
      parseAllowedOrigins(
        process.env.ALLOWED_ORIGINS ??
          'http://localhost:3005,http://localhost:5173'
      )
    )
  );

  await app.listen(process.env.PORT ?? 3005);
}
bootstrap();
