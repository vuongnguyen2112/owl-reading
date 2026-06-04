import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChaptersModule } from './chapters/chapters.module';
import { environmentValidationSchema } from './config/environment.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { NovelsModule } from './novels/novels.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '../.env'],
      isGlobal: true,
      validationSchema: environmentValidationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
    }),
    DatabaseModule,
    HealthModule,
    ChaptersModule,
    NovelsModule,
  ],
})
export class AppModule {}
