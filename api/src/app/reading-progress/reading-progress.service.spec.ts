import { NovelStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { ReadingProgressService } from './reading-progress.service';

describe('ReadingProgressService', () => {
  let prisma: {
    chapter: {
      findFirst: jest.Mock;
    };
    readingProgress: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
    };
  };
  let service: ReadingProgressService;

  beforeEach(() => {
    prisma = {
      chapter: {
        findFirst: jest.fn(),
      },
      readingProgress: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
    };
    service = new ReadingProgressService(prisma as unknown as PrismaService);
  });

  it('fetches reading progress for a user and novel', async () => {
    const lastReadAt = new Date('2026-01-01T00:00:00.000Z');

    prisma.readingProgress.findUnique.mockResolvedValue({
      id: 'progress-id',
      novelId: 'novel-id',
      chapterId: 'chapter-id',
      userId: 'user-id',
      lastReadAt,
      novel: {
        id: 'novel-id',
        slug: 'the-clockwork-owl',
      },
      chapter: {
        id: 'chapter-id',
        chapterNumber: 3,
      },
    });

    await expect(
      service.findByNovel('user-id', 'novel-id'),
    ).resolves.toEqual({
      id: 'progress-id',
      novelId: 'novel-id',
      novelSlug: 'the-clockwork-owl',
      chapterId: 'chapter-id',
      chapterNumber: 3,
      lastReadAt,
    });

    expect(prisma.readingProgress.findUnique).toHaveBeenCalledWith({
      where: {
        userId_novelId: {
          userId: 'user-id',
          novelId: 'novel-id',
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
  });

  it('saves reading progress only for a published chapter in the novel', async () => {
    const lastReadAt = new Date('2026-01-02T00:00:00.000Z');

    prisma.chapter.findFirst.mockResolvedValue({
      id: 'chapter-id',
      chapterNumber: 5,
      novel: {
        id: 'novel-id',
        slug: 'the-clockwork-owl',
      },
    });
    prisma.readingProgress.upsert.mockResolvedValue({
      id: 'progress-id',
      novelId: 'novel-id',
      chapterId: 'chapter-id',
      userId: 'user-id',
      lastReadAt,
      novel: {
        id: 'novel-id',
        slug: 'the-clockwork-owl',
      },
      chapter: {
        id: 'chapter-id',
        chapterNumber: 5,
      },
    });

    await expect(
      service.save('user-id', {
        novelId: 'novel-id',
        chapterId: 'chapter-id',
      }),
    ).resolves.toEqual({
      id: 'progress-id',
      novelId: 'novel-id',
      novelSlug: 'the-clockwork-owl',
      chapterId: 'chapter-id',
      chapterNumber: 5,
      lastReadAt,
    });

    expect(prisma.chapter.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'chapter-id',
        novelId: 'novel-id',
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
  });
});
