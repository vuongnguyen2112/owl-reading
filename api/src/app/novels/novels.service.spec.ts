import { NovelStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { NovelsService } from './novels.service';

describe('NovelsService', () => {
  let prisma: {
    novel: {
      count: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let service: NovelsService;

  beforeEach(() => {
    prisma = {
      novel: {
        count: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
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
});
