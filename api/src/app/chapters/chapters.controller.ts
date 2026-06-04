import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PlaceholderAdminGuard } from '../common/placeholder-admin.guard';
import { ChaptersService } from './chapters.service';
import { ChapterResponseDto } from './dto/chapter-response.dto';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { ListChaptersQueryDto } from './dto/list-chapters-query.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';

@ApiTags('chapters')
@Controller('novels/:novelSlug/chapters')
export class PublicChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Get()
  @ApiOperation({ summary: 'List chapters for a published novel.' })
  @ApiOkResponse({ description: 'Paginated published novel chapters.' })
  listPublishedByNovelSlug(
    @Param('novelSlug') novelSlug: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.chaptersService.listPublishedByNovelSlug(novelSlug, query);
  }

  @Get(':chapterNumber')
  @ApiOperation({ summary: 'Get a published chapter by chapter number.' })
  @ApiOkResponse({ type: ChapterResponseDto })
  findPublishedByNovelSlugAndNumber(
    @Param('novelSlug') novelSlug: string,
    @Param('chapterNumber', ParseIntPipe) chapterNumber: number,
  ) {
    return this.chaptersService.findPublishedByNovelSlugAndNumber(
      novelSlug,
      chapterNumber,
    );
  }
}

@ApiTags('admin chapters')
@ApiHeader({
  name: 'x-admin-key',
  description: 'Temporary admin API key until authentication is implemented.',
})
@UseGuards(PlaceholderAdminGuard)
@Controller('admin/chapters')
export class AdminChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Get()
  @ApiOperation({ summary: 'List chapters for admin.' })
  @ApiOkResponse({ description: 'Paginated chapters.' })
  listAdmin(@Query() query: ListChaptersQueryDto) {
    return this.chaptersService.listAdmin(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a chapter by id for admin.' })
  @ApiOkResponse({ type: ChapterResponseDto })
  findAdminById(@Param('id') id: string) {
    return this.chaptersService.findAdminById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a chapter.' })
  @ApiCreatedResponse({ type: ChapterResponseDto })
  create(@Body() dto: CreateChapterDto) {
    return this.chaptersService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a chapter.' })
  @ApiOkResponse({ type: ChapterResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateChapterDto) {
    return this.chaptersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a chapter.' })
  @ApiOkResponse({ type: ChapterResponseDto })
  delete(@Param('id') id: string) {
    return this.chaptersService.delete(id);
  }
}
