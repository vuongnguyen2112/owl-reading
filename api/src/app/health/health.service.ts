import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface HealthStatus {
  status: 'ok';
  timestamp: string;
  uptime: number;
}

export interface ReadinessStatus extends HealthStatus {
  database: 'ok';
}

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getHealth(): HealthStatus {
    return this.getLive();
  }

  getLive(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  async getReady(): Promise<ReadinessStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        ...this.getLive(),
        database: 'ok',
      };
    } catch {
      throw new ServiceUnavailableException('Database readiness check failed');
    }
  }
}
