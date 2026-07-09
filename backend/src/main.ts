import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Security
  app.use(helmet());

  // Nén response (gzip/brotli) — giảm dung lượng JSON trả về, tăng tốc load
  app.use(compression());

  // CORS — hỗ trợ localhost dev và Vercel production
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL ?? 'http://localhost:3000',
      /^https:\/\/.*\.vercel\.app$/,
    ] as (string | RegExp)[],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        const detail = errors.map((e) => ({
          field: e.property,
          value: e.value,
          constraints: e.constraints,
        }));
        logger.warn(`[ValidationPipe] Failed fields: ${JSON.stringify(detail)}`);
        const messages = errors.map((e) => Object.values(e.constraints ?? {}).join(', '));
        const { BadRequestException } = require('@nestjs/common');
        return new BadRequestException(messages);
      },
    }),
  );

  // Swagger — chỉ bật ở non-production
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('AIZEN Education API')
      .setDescription('API for AIZEN Education Platform')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  logger.log(`Application running on port ${port}`);
}

bootstrap();
