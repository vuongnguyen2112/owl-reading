import { ConflictException } from '@nestjs/common';
import { NovelStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { NovelsService } from './novels.service';

describe('NovelsService', () => {
  let prisma: {
    chapter: {
      count: jest.Mock;
    };
    novel: {
      count: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };
  let service: NovelsService;

  beforeEach(() => {
    prisma = {
      chapter: {
        count: jest.fn(),
      },
      novel: {
        count: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new NovelsService(prisma as unknown as PrismaService);
  });

  it('creates novels with a generated slug and draft status by default', async () => {
    const createdNovel = {
      id: 'novel-id',
      title: 'The Clockwork Owl',
      slug: 'the-clockwork-owl',
      description: null,
      coverImageUrl: null,
      status: NovelStatus.DRAFT,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    };
    prisma.novel.create.mockResolvedValue(createdNovel);

    await expect(
      service.create({ title: 'The Clockwork Owl' }),
    ).resolves.toEqual(createdNovel);

    expect(prisma.novel.create).toHaveBeenCalledWith({
      data: {
        title: 'The Clockwork Owl',
        slug: 'the-clockwork-owl',
        description: undefined,
        coverImageUrl: undefined,
        status: NovelStatus.DRAFT,
      },
    });
  });

  it('lists only published novels and searches by title', async () => {
    prisma.novel.findMany.mockResolvedValue([]);
    prisma.novel.count.mockResolvedValue(0);

    await service.listPublished({
      page: 2,
      pageSize: 10,
      search: 'owl',
    });

    expect(prisma.novel.findMany).toHaveBeenCalledWith({
      where: {
        status: NovelStatus.PUBLISHED,
        title: {
          contains: 'owl',
          mode: 'insensitive',
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: 10,
      take: 10,
    });
    expect(prisma.novel.count).toHaveBeenCalledWith({
      where: {
        status: NovelStatus.PUBLISHED,
        title: {
          contains: 'owl',
          mode: 'insensitive',
        },
      },
    });
  });

  it('blocks creating novels as published because they have no chapters yet', async () => {
    await expect(
      service.create({
        title: 'The Clockwork Owl',
        status: NovelStatus.PUBLISHED,
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.novel.create).not.toHaveBeenCalled();
  });

  it('blocks publishing existing novels with no chapters', async () => {
    prisma.novel.findUnique.mockResolvedValue({
      _count: { chapters: 0 },
    });

    await expect(
      service.update('novel-id', { status: NovelStatus.PUBLISHED }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.novel.findUnique).toHaveBeenCalledWith({
      where: { id: 'novel-id' },
      select: {
        _count: {
          select: { chapters: true },
        },
      },
    });
    expect(prisma.novel.update).not.toHaveBeenCalled();
  });

  it('allows publishing existing novels with chapters', async () => {
    const updatedNovel = {
      id: 'novel-id',
      title: 'The Clockwork Owl',
      slug: 'the-clockwork-owl',
      description: null,
      coverImageUrl: null,
      status: NovelStatus.PUBLISHED,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    };

    prisma.novel.findUnique.mockResolvedValue({
      _count: { chapters: 1 },
    });
    prisma.novel.update.mockResolvedValue(updatedNovel);

    await expect(
      service.update('novel-id', { status: NovelStatus.PUBLISHED }),
    ).resolves.toEqual(updatedNovel);
    expect(prisma.novel.update).toHaveBeenCalledWith({
      where: { id: 'novel-id' },
      data: {
        title: undefined,
        slug: undefined,
        description: undefined,
        coverImageUrl: undefined,
        status: NovelStatus.PUBLISHED,
      },
    });
  });

  it('blocks deleting published novels', async () => {
    prisma.novel.findUnique.mockResolvedValue({
      status: NovelStatus.PUBLISHED,
    });

    await expect(service.delete('novel-id')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.novel.delete).not.toHaveBeenCalled();
  });

  it('allows deleting draft novels', async () => {
    const deletedNovel = {
      id: 'novel-id',
      title: 'The Clockwork Owl',
      slug: 'the-clockwork-owl',
      description: null,
      coverImageUrl: null,
      status: NovelStatus.DRAFT,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    };

    prisma.novel.findUnique.mockResolvedValue({
      status: NovelStatus.DRAFT,
    });
    prisma.novel.delete.mockResolvedValue(deletedNovel);

    await expect(service.delete('novel-id')).resolves.toEqual(deletedNovel);
    expect(prisma.novel.delete).toHaveBeenCalledWith({
      where: { id: 'novel-id' },
    });
  });

  it('allows deleting archived novels', async () => {
    const deletedNovel = {
      id: 'novel-id',
      title: 'The Clockwork Owl',
      slug: 'the-clockwork-owl',
      description: null,
      coverImageUrl: null,
      status: NovelStatus.ARCHIVED,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    };

    prisma.novel.findUnique.mockResolvedValue({
      status: NovelStatus.ARCHIVED,
    });
    prisma.novel.delete.mockResolvedValue(deletedNovel);

    await expect(service.delete('novel-id')).resolves.toEqual(deletedNovel);
  });
});
