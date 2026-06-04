import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { ChaptersModule } from './chapters/chapters.module';
import { environmentValidationSchema } from './config/environment.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { NovelsModule } from './novels/novels.module';
import { ReadingProgressModule } from './reading-progress/reading-progress.module';
import { UsersModule } from './users/users.module';

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
    AuthModule,
    DatabaseModule,
    HealthModule,
    ChaptersModule,
    NovelsModule,
    ReadingProgressModule,
    BookmarksModule,
    UsersModule,
  ],
})
export class AppModule {}
