import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 허용 react에서 실행될 수 있게 
  app.enableCors({
  origin: [
    'http://localhost:5173',
    'https://2025-it-show-dont-say-that-client.vercel.app',
  ],
  credentials: true,
});


  await app.listen(3000);
}
bootstrap();
