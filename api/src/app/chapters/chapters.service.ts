import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NovelStatus, Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { getPagination, toPaginatedResponse } from '../common/pagination';
import { PrismaService } from '../database/prisma.service';
import { toChapterResponseDto } from './dto/chapter-response.dto';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { ListChaptersQueryDto } from './dto/list-chapters-query.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';

@Injectable()
export class ChaptersService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublishedByNovelSlug(novelSlug: string, query: PaginationQueryDto) {
    const where: Prisma.ChapterWhereInput = {
      novel: {
        slug: novelSlug,
        status: NovelStatus.PUBLISHED,
      },
    };
    const { skip, take } = getPagination(query.page, query.pageSize);
    const [items, total] = await Promise.all([
      this.prisma.chapter.findMany({
        where,
        orderBy: { chapterNumber: 'asc' },
        skip,
        take,
      }),
      this.prisma.chapter.count({ where }),
    ]);

    if (total === 0) {
      await this.ensurePublishedNovelExists(novelSlug);
    }

    return toPaginatedResponse(
      items.map((chapter) => toChapterResponseDto(chapter)),
      total,
      query.page,
      query.pageSize,
    );
  }

  async findPublishedByNovelSlugAndNumber(
    novelSlug: string,
    chapterNumber: number,
  ) {
    const chapter = await this.prisma.chapter.findFirst({
      where: {
        chapterNumber,
        novel: {
          slug: novelSlug,
          status: NovelStatus.PUBLISHED,
        },
      },
    });

    if (!chapter) {
      throw new NotFoundException('Published chapter was not found.');
    }

    const [previousChapter, nextChapter] = await Promise.all([
      this.prisma.chapter.findFirst({
        where: {
          novelId: chapter.novelId,
          chapterNumber: { lt: chapter.chapterNumber },
        },
        orderBy: { chapterNumber: 'desc' },
        select: { chapterNumber: true },
      }),
      this.prisma.chapter.findFirst({
        where: {
          novelId: chapter.novelId,
          chapterNumber: { gt: chapter.chapterNumber },
        },
        orderBy: { chapterNumber: 'asc' },
        select: { chapterNumber: true },
      }),
    ]);

    return toChapterResponseDto(chapter, {
      previousChapterNumber: previousChapter?.chapterNumber ?? null,
      nextChapterNumber: nextChapter?.chapterNumber ?? null,
    });
  }

  async listAdmin(query: ListChaptersQueryDto) {
    const where: Prisma.ChapterWhereInput = query.novelId
      ? { novelId: query.novelId }
      : {};
    const { skip, take } = getPagination(query.page, query.pageSize);
    const [items, total] = await Promise.all([
      this.prisma.chapter.findMany({
        where,
        orderBy: [{ novelId: 'asc' }, { chapterNumber: 'asc' }],
        skip,
        take,
      }),
      this.prisma.chapter.count({ where }),
    ]);

    return toPaginatedResponse(
      items.map((chapter) => toChapterResponseDto(chapter)),
      total,
      query.page,
      query.pageSize,
    );
  }

  async findAdminById(id: string) {
    const chapter = await this.prisma.chapter.findUnique({ where: { id } });

    if (!chapter) {
      throw new NotFoundException('Chapter was not found.');
    }

    return toChapterResponseDto(chapter);
  }

  async create(dto: CreateChapterDto) {
    try {
      const chapter = await this.prisma.chapter.create({
        data: {
          novelId: dto.novelId,
          chapterNumber: dto.chapterNumber,
          title: dto.title,
          content: dto.content,
        },
      });

      return toChapterResponseDto(chapter);
    } catch (error) {
      this.handleKnownError(error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateChapterDto) {
    try {
      const chapter = await this.prisma.chapter.update({
        where: { id },
        data: {
          novelId: dto.novelId,
          chapterNumber: dto.chapterNumber,
          title: dto.title,
          content: dto.content,
        },
      });

      return toChapterResponseDto(chapter);
    } catch (error) {
      this.handleKnownError(error);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const existingChapter = await this.prisma.chapter.findUnique({
        where: { id },
        select: {
          novel: {
            select: {
              status: true,
            },
          },
        },
      });

      if (!existingChapter) {
        throw new NotFoundException('Chapter was not found.');
      }

      if (existingChapter.novel.status === NovelStatus.PUBLISHED) {
        throw new ConflictException(
          'Chapters from published novels cannot be deleted.',
        );
      }

      const chapter = await this.prisma.chapter.delete({ where: { id } });

      return toChapterResponseDto(chapter);
    } catch (error) {
      this.handleKnownError(error);
      throw error;
    }
  }

  private async ensurePublishedNovelExists(novelSlug: string) {
    const novel = await this.prisma.novel.findFirst({
      where: { slug: novelSlug, status: NovelStatus.PUBLISHED },
      select: { id: true },
    });

    if (!novel) {
      throw new NotFoundException('Published novel was not found.');
    }
  }

  private handleKnownError(error: unknown): void {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
      return;
    }

    if (error.code === 'P2002') {
      throw new ConflictException(
        'Chapter number already exists for this novel.',
      );
    }

    if (error.code === 'P2003') {
      throw new NotFoundException('Novel was not found.');
    }

    if (error.code === 'P2025') {
      throw new NotFoundException('Chapter was not found.');
    }
  }
}
