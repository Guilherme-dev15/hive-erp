import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Remove properties not in DTO
    forbidNonWhitelisted: true, // Throw error if non-DTO property is sent
    transform: true, // Auto-transform payloads to DTO instances
  }));

  // Habilitar CORS assim como no Express (mas aqui bem aberto para admin dev)
  app.enableCors();

  // Docker Desktop backend proxy might use 3000 locally on some Windows setups
  // Let's use 3005 to be safe
  await app.listen(process.env.PORT ?? 3005);
}
bootstrap();
