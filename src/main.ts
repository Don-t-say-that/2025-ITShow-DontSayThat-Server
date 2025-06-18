import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = [
    'http://localhost:5173',
    'https://2025-it-show-dont-say-that-client.vercel.app',
    'https://dontsaythat.mirim-it-show.site',
  ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });


  await app.listen(3000);
}
bootstrap();
