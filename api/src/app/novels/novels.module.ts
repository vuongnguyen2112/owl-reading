import { Module } from '@nestjs/common';
import { PlaceholderAdminGuard } from '../common/placeholder-admin.guard';
import {
  AdminNovelsController,
  PublicNovelsController,
} from './novels.controller';
import { NovelsService } from './novels.service';

@Module({
  controllers: [PublicNovelsController, AdminNovelsController],
  providers: [NovelsService, PlaceholderAdminGuard],
  exports: [NovelsService],
})
export class NovelsModule {}
