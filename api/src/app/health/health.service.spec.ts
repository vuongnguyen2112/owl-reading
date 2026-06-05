import { ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service';

const prisma = {
  $queryRaw: jest.fn(),
};

describe('HealthService', () => {
  beforeEach(() => {
    prisma.$queryRaw.mockReset();
  });

  it('returns basic API health information', () => {
    const service = new HealthService(prisma as never);

    expect(service.getHealth()).toEqual({
      status: 'ok',
      timestamp: expect.any(String),
      uptime: expect.any(Number),
    });
  });

  it('returns liveness information', () => {
    const service = new HealthService(prisma as never);

    expect(service.getLive()).toEqual({
      status: 'ok',
      timestamp: expect.any(String),
      uptime: expect.any(Number),
    });
  });

  it('returns readiness when the database check succeeds', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    const service = new HealthService(prisma as never);

    await expect(service.getReady()).resolves.toEqual({
      status: 'ok',
      timestamp: expect.any(String),
      uptime: expect.any(Number),
      database: 'ok',
    });
  });

  it('returns 503 readiness failure when the database check fails', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('database unavailable'));
    const service = new HealthService(prisma as never);

    await expect(service.getReady()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
