import { BadRequestException, NotFoundException } from '@nestjs/common';
import { NovelStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { BookmarksService } from './bookmarks.service';

describe('BookmarksService', () => {
  let prisma: {
    bookmark: {
      findMany: jest.Mock;
      upsert: jest.Mock;
      deleteMany: jest.Mock;
    };
    chapter: {
      findFirst: jest.Mock;
    };
    novel: {
      findFirst: jest.Mock;
    };
  };
  let service: BookmarksService;

  beforeEach(() => {
    prisma = {
      bookmark: {
        findMany: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
      chapter: {
        findFirst: jest.fn(),
      },
      novel: {
        findFirst: jest.fn(),
      },
    };
    service = new BookmarksService(prisma as unknown as PrismaService);
  });

  it('creates a bookmark for a published novel', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');

    prisma.novel.findFirst.mockResolvedValue({ id: 'novel-id' });
    prisma.bookmark.upsert.mockResolvedValue({
      id: 'bookmark-id',
      novelId: 'novel-id',
      chapterId: null,
      createdAt,
      novel: {
        id: 'novel-id',
        slug: 'the-clockwork-owl',
        title: 'The Clockwork Owl',
      },
      chapter: null,
    });

    await expect(
      service.create('user-id', { novelId: 'novel-id' }),
    ).resolves.toEqual({
      id: 'bookmark-id',
      novelId: 'novel-id',
      novelSlug: 'the-clockwork-owl',
      novelTitle: 'The Clockwork Owl',
      chapterId: null,
      chapterNumber: null,
      chapterTitle: null,
      createdAt,
    });

    expect(prisma.novel.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'novel-id',
        status: NovelStatus.PUBLISHED,
      },
      select: { id: true },
    });
  });

  it('creates a bookmark for a published chapter', async () => {
    const createdAt = new Date('2026-01-02T00:00:00.000Z');

    prisma.chapter.findFirst.mockResolvedValue({ id: 'chapter-id' });
    prisma.bookmark.upsert.mockResolvedValue({
      id: 'bookmark-id',
      novelId: null,
      chapterId: 'chapter-id',
      createdAt,
      novel: null,
      chapter: {
        id: 'chapter-id',
        chapterNumber: 3,
        title: 'A Door Opens',
        novel: {
          id: 'novel-id',
          slug: 'the-clockwork-owl',
          title: 'The Clockwork Owl',
        },
      },
    });

    await expect(
      service.create('user-id', { chapterId: 'chapter-id' }),
    ).resolves.toEqual({
      id: 'bookmark-id',
      novelId: 'novel-id',
      novelSlug: 'the-clockwork-owl',
      novelTitle: 'The Clockwork Owl',
      chapterId: 'chapter-id',
      chapterNumber: 3,
      chapterTitle: 'A Door Opens',
      createdAt,
    });

    expect(prisma.chapter.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'chapter-id',
        novel: {
          status: NovelStatus.PUBLISHED,
        },
      },
      select: { id: true },
    });
  });

  it('requires exactly one bookmark target', async () => {
    await expect(service.create('user-id', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.create('user-id', {
        novelId: 'novel-id',
        chapterId: 'chapter-id',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('only removes bookmarks owned by the current user', async () => {
    prisma.bookmark.deleteMany.mockResolvedValue({ count: 0 });

    await expect(
      service.remove('user-id', 'bookmark-id'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.bookmark.deleteMany).toHaveBeenCalledWith({
      where: {
        id: 'bookmark-id',
        userId: 'user-id',
      },
    });
  });
});
