import { ConflictException } from '@nestjs/common';
import { NovelStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ChaptersService } from './chapters.service';

describe('ChaptersService', () => {
  let prisma: {
    chapter: {
      count: jest.Mock;
      delete: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
  };
  let service: ChaptersService;

  beforeEach(() => {
    prisma = {
      chapter: {
        count: jest.fn(),
        delete: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    service = new ChaptersService(prisma as unknown as PrismaService);
  });

  it('lists chapters only for published novels by slug', async () => {
    prisma.chapter.findMany.mockResolvedValue([]);
    prisma.chapter.count.mockResolvedValue(1);

    await service.listPublishedByNovelSlug('the-clockwork-owl', {
      page: 1,
      pageSize: 5,
    });

    expect(prisma.chapter.findMany).toHaveBeenCalledWith({
      where: {
        novel: {
          slug: 'the-clockwork-owl',
          status: NovelStatus.PUBLISHED,
        },
      },
      orderBy: { chapterNumber: 'asc' },
      skip: 0,
      take: 5,
    });
  });

  it('finds a chapter only when its novel is published', async () => {
    const chapter = {
      id: 'chapter-id',
      novelId: 'novel-id',
      chapterNumber: 3,
      title: 'A Promise in Gears',
      content: '...',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    };
    prisma.chapter.findFirst
      .mockResolvedValueOnce(chapter)
      .mockResolvedValueOnce({ chapterNumber: 2 })
      .mockResolvedValueOnce({ chapterNumber: 4 });

    await expect(
      service.findPublishedByNovelSlugAndNumber('the-clockwork-owl', 3),
    ).resolves.toEqual({
      ...chapter,
      previousChapterNumber: 2,
      nextChapterNumber: 4,
    });

    expect(prisma.chapter.findFirst).toHaveBeenNthCalledWith(1, {
      where: {
        chapterNumber: 3,
        novel: {
          slug: 'the-clockwork-owl',
          status: NovelStatus.PUBLISHED,
        },
      },
    });
    expect(prisma.chapter.findFirst).toHaveBeenNthCalledWith(2, {
      where: {
        novelId: 'novel-id',
        chapterNumber: { lt: 3 },
      },
      orderBy: { chapterNumber: 'desc' },
      select: { chapterNumber: true },
    });
    expect(prisma.chapter.findFirst).toHaveBeenNthCalledWith(3, {
      where: {
        novelId: 'novel-id',
        chapterNumber: { gt: 3 },
      },
      orderBy: { chapterNumber: 'asc' },
      select: { chapterNumber: true },
    });
  });

  it('blocks deleting chapters from published novels', async () => {
    prisma.chapter.findUnique.mockResolvedValue({
      novel: {
        status: NovelStatus.PUBLISHED,
      },
    });

    await expect(service.delete('chapter-id')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.chapter.delete).not.toHaveBeenCalled();
  });

  it('allows deleting chapters from draft novels', async () => {
    const deletedChapter = {
      id: 'chapter-id',
      novelId: 'novel-id',
      chapterNumber: 1,
      title: 'A Draft Chapter',
      content: '...',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    };

    prisma.chapter.findUnique.mockResolvedValue({
      novel: {
        status: NovelStatus.DRAFT,
      },
    });
    prisma.chapter.delete.mockResolvedValue(deletedChapter);

    await expect(service.delete('chapter-id')).resolves.toEqual(deletedChapter);
    expect(prisma.chapter.delete).toHaveBeenCalledWith({
      where: { id: 'chapter-id' },
    });
  });

  it('allows deleting chapters from archived novels', async () => {
    const deletedChapter = {
      id: 'chapter-id',
      novelId: 'novel-id',
      chapterNumber: 1,
      title: 'An Archived Chapter',
      content: '...',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    };

    prisma.chapter.findUnique.mockResolvedValue({
      novel: {
        status: NovelStatus.ARCHIVED,
      },
    });
    prisma.chapter.delete.mockResolvedValue(deletedChapter);

    await expect(service.delete('chapter-id')).resolves.toEqual(deletedChapter);
  });
});
