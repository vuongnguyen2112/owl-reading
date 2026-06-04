import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateNovelDto } from './dto/create-novel.dto';
import { ListNovelsQueryDto } from './dto/list-novels-query.dto';
import { NovelResponseDto } from './dto/novel-response.dto';
import { UpdateNovelDto } from './dto/update-novel.dto';
import { NovelsService } from './novels.service';

@ApiTags('novels')
@Controller('novels')
export class PublicNovelsController {
  constructor(private readonly novelsService: NovelsService) {}

  @Get()
  @ApiOperation({ summary: 'List published novels.' })
  @ApiOkResponse({ description: 'Paginated published novels.' })
  listPublished(@Query() query: ListNovelsQueryDto) {
    return this.novelsService.listPublished(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a published novel by slug.' })
  @ApiOkResponse({ type: NovelResponseDto })
  findPublishedBySlug(@Param('slug') slug: string) {
    return this.novelsService.findPublishedBySlug(slug);
  }
}

@ApiTags('admin novels')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/novels')
export class AdminNovelsController {
  constructor(private readonly novelsService: NovelsService) {}

  @Get()
  @ApiOperation({ summary: 'List all novels for admin.' })
  @ApiOkResponse({ description: 'Paginated novels.' })
  listAdmin(@Query() query: ListNovelsQueryDto) {
    return this.novelsService.listAdmin(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a novel by id for admin.' })
  @ApiOkResponse({ type: NovelResponseDto })
  findAdminById(@Param('id', ParseUUIDPipe) id: string) {
    return this.novelsService.findAdminById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a novel.' })
  @ApiCreatedResponse({ type: NovelResponseDto })
  create(@Body() dto: CreateNovelDto) {
    return this.novelsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a novel.' })
  @ApiOkResponse({ type: NovelResponseDto })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateNovelDto) {
    return this.novelsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a novel.' })
  @ApiOkResponse({ type: NovelResponseDto })
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.novelsService.delete(id);
  }
}
