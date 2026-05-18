import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from './shared/filters';

/**
 * Validate critical environment variables on startup.
 * Throws immediately if production is missing required config.
 */
function validateEnvironment() {
  const logger = new Logger('Bootstrap');
  const isProd = process.env.NODE_ENV === 'production';

  const required: { key: string; prodOnly?: boolean }[] = [
    { key: 'DATABASE_URL' },
    { key: 'JWT_SECRET' },
    { key: 'FRONTEND_URL' },
    { key: 'WEBHOOK_SECRET', prodOnly: true },
    { key: 'SEPAY_API_KEY', prodOnly: true },
  ];

  const missing: string[] = [];
  for (const { key, prodOnly } of required) {
    if (!process.env[key]) {
      if (prodOnly && !isProd) {
        logger.warn(`[Config] ${key} is not set — required in production`);
      } else if (!prodOnly) {
        // Non-prod-only vars: warn in dev, fail in prod
        if (isProd) {
          missing.push(key);
        } else {
          logger.warn(`[Config] ${key} is not set`);
        }
      } else {
        missing.push(key);
      }
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `[FATAL] Missing required environment variables: ${missing.join(', ')}`,
    );
  }
}

async function bootstrap() {
  validateEnvironment();

  const app = await NestFactory.create(AppModule);

  // ─── Security: HTTP Headers ─────────────────────────────────────────────────
  app.use(helmet({
    crossOriginResourcePolicy: false,
  }));

  // Global prefix — matches README: /api/v1
  app.setGlobalPrefix('api/v1');

  // Cookie parser for HttpOnly refresh tokens
  app.use(cookieParser());

  // Configure CORS for frontend communication
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',');
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Range'],
    exposedHeaders: ['Authorization', 'Content-Range', 'Accept-Ranges', 'Content-Length'],
  });

  // ─── Global Pipes ───────────────────────────────────────────────────────────
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // ─── Global Exception Filter ────────────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('LMS API')
    .setDescription('API for LMS E-Learning Platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  // Swagger at /api/docs — matches README
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
