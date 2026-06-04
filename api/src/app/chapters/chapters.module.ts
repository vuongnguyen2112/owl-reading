import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  AdminChaptersController,
  PublicChaptersController,
} from './chapters.controller';
import { ChaptersService } from './chapters.service';

@Module({
  imports: [AuthModule],
  controllers: [PublicChaptersController, AdminChaptersController],
  providers: [ChaptersService],
})
export class ChaptersModule {}
