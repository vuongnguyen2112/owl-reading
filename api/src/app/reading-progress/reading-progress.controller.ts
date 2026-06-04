import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReadingProgressResponseDto } from './dto/reading-progress-response.dto';
import { SaveReadingProgressDto } from './dto/save-reading-progress.dto';
import { ReadingProgressService } from './reading-progress.service';

@ApiTags('reading progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reading-progress')
export class ReadingProgressController {
  constructor(private readonly readingProgressService: ReadingProgressService) {}

  @Get('novels/:novelId')
  @ApiOkResponse({ type: ReadingProgressResponseDto })
  findByNovel(@CurrentUser() user: AuthenticatedUser, @Param('novelId') novelId: string) {
    return this.readingProgressService.findByNovel(user.sub, novelId);
  }

  @Put()
  @ApiOkResponse({ type: ReadingProgressResponseDto })
  save(@CurrentUser() user: AuthenticatedUser, @Body() dto: SaveReadingProgressDto) {
    return this.readingProgressService.save(user.sub, dto);
  }
}
