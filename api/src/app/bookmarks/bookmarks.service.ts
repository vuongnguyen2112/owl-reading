import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NovelStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import {
  BookmarkResponseDto,
  toBookmarkResponseDto,
} from './dto/bookmark-response.dto';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';

const BOOKMARK_INCLUDE = {
  novel: {
    select: {
      id: true,
      slug: true,
      title: true,
    },
  },
  chapter: {
    select: {
      id: true,
      chapterNumber: true,
      title: true,
      novel: {
        select: {
          id: true,
          slug: true,
          title: true,
        },
      },
    },
  },
} as const;

@Injectable()
export class BookmarksService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<BookmarkResponseDto[]> {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
      include: BOOKMARK_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return bookmarks.map(toBookmarkResponseDto);
  }

  async create(
    userId: string,
    dto: CreateBookmarkDto,
  ): Promise<BookmarkResponseDto> {
    this.validateTarget(dto);

    if (dto.novelId) {
      return this.createNovelBookmark(userId, dto.novelId);
    }

    return this.createChapterBookmark(userId, dto.chapterId as string);
  }

  async remove(userId: string, id: string): Promise<{ success: true }> {
    const result = await this.prisma.bookmark.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      throw new NotFoundException('Bookmark was not found.');
    }

    return { success: true };
  }

  private async createNovelBookmark(userId: string, novelId: string) {
    const novel = await this.prisma.novel.findFirst({
      where: { id: novelId, status: NovelStatus.PUBLISHED },
      select: { id: true },
    });

    if (!novel) {
      throw new NotFoundException('Published novel was not found.');
    }

    const bookmark = await this.prisma.bookmark.upsert({
      where: {
        userId_novelId: {
          userId,
          novelId,
        },
      },
      create: {
        userId,
        novelId,
      },
      update: {},
      include: BOOKMARK_INCLUDE,
    });

    return toBookmarkResponseDto(bookmark);
  }

  private async createChapterBookmark(userId: string, chapterId: string) {
    const chapter = await this.prisma.chapter.findFirst({
      where: {
        id: chapterId,
        novel: {
          status: NovelStatus.PUBLISHED,
        },
      },
      select: { id: true },
    });

    if (!chapter) {
      throw new NotFoundException('Published chapter was not found.');
    }

    const bookmark = await this.prisma.bookmark.upsert({
      where: {
        userId_chapterId: {
          userId,
          chapterId,
        },
      },
      create: {
        userId,
        chapterId,
      },
      update: {},
      include: BOOKMARK_INCLUDE,
    });

    return toBookmarkResponseDto(bookmark);
  }

  private validateTarget(dto: CreateBookmarkDto): void {
    const targetCount =
      Number(Boolean(dto.novelId)) + Number(Boolean(dto.chapterId));

    if (targetCount !== 1) {
      throw new BadRequestException(
        'Provide exactly one bookmark target: novelId or chapterId.',
      );
    }
  }
}
