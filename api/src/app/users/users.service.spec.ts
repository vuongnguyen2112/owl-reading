import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let prisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let service: UsersService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new UsersService(prisma as unknown as PrismaService);
  });

  it('returns the current user profile', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const updatedAt = new Date('2026-01-02T00:00:00.000Z');

    prisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      email: 'reader@example.com',
      displayName: 'Reader',
      passwordHash: 'hash',
      role: 'USER',
      createdAt,
      updatedAt,
    });

    await expect(service.getCurrentProfile('user-id')).resolves.toEqual({
      id: 'user-id',
      email: 'reader@example.com',
      displayName: 'Reader',
      createdAt,
      updatedAt,
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-id' },
    });
  });

  it('rejects deleted users', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.getCurrentProfile('user-id')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('updates only the current user display name', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const updatedAt = new Date('2026-01-03T00:00:00.000Z');

    prisma.user.update.mockResolvedValue({
      id: 'user-id',
      email: 'reader@example.com',
      displayName: 'Updated Reader',
      passwordHash: 'hash',
      role: 'USER',
      createdAt,
      updatedAt,
    });

    await expect(
      service.updateCurrentProfile('user-id', {
        displayName: ' Updated Reader ',
      }),
    ).resolves.toEqual({
      id: 'user-id',
      email: 'reader@example.com',
      displayName: 'Updated Reader',
      createdAt,
      updatedAt,
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { displayName: 'Updated Reader' },
    });
  });
});
