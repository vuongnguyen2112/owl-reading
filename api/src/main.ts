import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { GlobalExceptionFilter } from './app/common/observability/global-exception.filter';
import { requestLoggingMiddleware } from './app/common/observability/request-logging.middleware';

const apiPrefix = 'api';
const bootstrapLogger = new Logger('Bootstrap');

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
  app.enableShutdownHooks();
  app.use(requestLoggingMiddleware);
  app.useGlobalFilters(new GlobalExceptionFilter());
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
  bootstrapLogger.log(
    JSON.stringify({
      event: 'api_startup',
      status: 'ok',
      nodeEnv,
      port,
      apiPrefix,
    }),
  );
  if (nodeEnv !== 'production') {
    bootstrapLogger.log(
      `Swagger docs are available at: http://localhost:${port}/${apiPrefix}/docs`,
    );
  }
}

bootstrap().catch((error: unknown) => {
  bootstrapLogger.error(
    JSON.stringify({
      event: 'api_startup',
      status: 'failed',
      errorName: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : String(error),
    }),
    error instanceof Error ? error.stack : String(error),
  );
  process.exit(1);
});
