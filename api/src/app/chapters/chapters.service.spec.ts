import { NovelStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ChaptersService } from './chapters.service';

describe('ChaptersService', () => {
  let prisma: {
    chapter: {
      count: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let service: ChaptersService;

  beforeEach(() => {
    prisma = {
      chapter: {
        count: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
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
});
