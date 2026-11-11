import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Kích hoạt cookie-parser để trích xuất cookie từ request headers (req.cookies)
  app.use(cookieParser());

  // 2. Kích hoạt Validation toàn cục
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 3. Cấu hình CORS bắt buộc khi làm việc với Cookie và Trình duyệt
  app.enableCors({
    // TUYỆT ĐỐI KHÔNG dùng origin: '*' khi credentials: true
    origin: ['http://localhost:3000'],
    // Cho phép trình duyệt gửi và nhận Cookie (credentials: 'include')
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 [NestJS Auth API] Server đang chạy tại: http://localhost:${port}`);
}
bootstrap();
