/**
 * This is not a production server yet.
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

const apiPrefix = 'api';

function parseCorsOrigins(origins: string): string[] {
  return origins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('PORT');
  const nodeEnv = configService.getOrThrow<string>('NODE_ENV');
  const corsOrigins = parseCorsOrigins(
    configService.getOrThrow<string>('CORS_ORIGINS'),
  );

  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Owl Reading API')
      .setDescription('Backend API for the Owl Reading novel platform.')
      .setVersion('0.1.0')
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, swaggerDocument);
  }

  await app.listen(port);
  Logger.log(
    `Application is running on: http://localhost:${port}/${apiPrefix}`,
  );
  if (nodeEnv !== 'production') {
    Logger.log(
      `Swagger docs are available at: http://localhost:${port}/${apiPrefix}/docs`,
    );
  }
}

bootstrap();
