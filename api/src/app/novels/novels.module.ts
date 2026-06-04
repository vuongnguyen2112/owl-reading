import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  AdminNovelsController,
  PublicNovelsController,
} from './novels.controller';
import { NovelsService } from './novels.service';

@Module({
  imports: [AuthModule],
  controllers: [PublicNovelsController, AdminNovelsController],
  providers: [NovelsService],
  exports: [NovelsService],
})
export class NovelsModule {}
