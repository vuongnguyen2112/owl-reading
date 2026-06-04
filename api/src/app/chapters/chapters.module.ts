import { Module } from '@nestjs/common';
import { PlaceholderAdminGuard } from '../common/placeholder-admin.guard';
import {
  AdminChaptersController,
  PublicChaptersController,
} from './chapters.controller';
import { ChaptersService } from './chapters.service';

@Module({
  controllers: [PublicChaptersController, AdminChaptersController],
  providers: [ChaptersService, PlaceholderAdminGuard],
})
export class ChaptersModule {}
