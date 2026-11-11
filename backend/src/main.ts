import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Cho phép Frontend gọi API (CORS)
  app.enableCors();

  // 2. Lọc & Validate dữ liệu đầu vào tự động
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // 3. Khởi tạo tài liệu Swagger OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Thư Hải E-Commerce API')
    .setDescription('Tài liệu API cho hệ thống bán sách cũ Thư Hải')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();