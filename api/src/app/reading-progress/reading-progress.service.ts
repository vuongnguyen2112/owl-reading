import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { NovelStatus, ReadingProgress } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ReadingProgressResponseDto } from './dto/reading-progress-response.dto';
import { SaveReadingProgressDto } from './dto/save-reading-progress.dto';

type ProgressWithChapter = ReadingProgress & {
  chapter: {
    id: string;
    chapterNumber: number;
  };
  novel: {
    id: string;
    slug: string;
  };
};

@Injectable()
export class ReadingProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async findByNovel(
    userId: string,
    novelId: string,
  ): Promise<ReadingProgressResponseDto | null> {
    const progress = await this.prisma.readingProgress.findUnique({
      where: {
        userId_novelId: {
          userId,
          novelId,
        },
      },
      include: {
        chapter: {
          select: {
            id: true,
            chapterNumber: true,
          },
        },
        novel: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
    });

    return progress ? this.toResponse(progress) : null;
  }

  async save(
    userId: string,
    dto: SaveReadingProgressDto,
  ): Promise<ReadingProgressResponseDto> {
    const chapter = await this.prisma.chapter.findFirst({
      where: {
        id: dto.chapterId,
        novelId: dto.novelId,
        novel: {
          status: NovelStatus.PUBLISHED,
        },
      },
      select: {
        id: true,
        chapterNumber: true,
        novel: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
    });

    if (!chapter) {
      throw new NotFoundException('Published chapter was not found.');
    }

    if (chapter.novel.id !== dto.novelId) {
      throw new BadRequestException('Chapter does not belong to this novel.');
    }

    const progress = await this.prisma.readingProgress.upsert({
      where: {
        userId_novelId: {
          userId,
          novelId: dto.novelId,
        },
      },
      update: {
        chapterId: dto.chapterId,
        lastReadAt: new Date(),
      },
      create: {
        userId,
        novelId: dto.novelId,
        chapterId: dto.chapterId,
      },
      include: {
        chapter: {
          select: {
            id: true,
            chapterNumber: true,
          },
        },
        novel: {
          select: {
            id: true,
            slug: true,
          },
        },
      },
    });

    return this.toResponse(progress);
  }

  private toResponse(progress: ProgressWithChapter): ReadingProgressResponseDto {
    return {
      id: progress.id,
      novelId: progress.novel.id,
      novelSlug: progress.novel.slug,
      chapterId: progress.chapter.id,
      chapterNumber: progress.chapter.chapterNumber,
      lastReadAt: progress.lastReadAt,
    };
  }
}
