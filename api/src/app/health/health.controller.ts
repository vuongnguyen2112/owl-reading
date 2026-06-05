import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthResponseDto,
  ReadinessResponseDto,
} from './health-response.dto';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOkResponse({
    description: 'API health status.',
    type: HealthResponseDto,
  })
  getHealth() {
    return this.healthService.getHealth();
  }

  @Get('live')
  @ApiOkResponse({
    description: 'API liveness status.',
    type: HealthResponseDto,
  })
  getLive() {
    return this.healthService.getLive();
  }

  @Get('ready')
  @ApiOkResponse({
    description: 'API readiness status, including database connectivity.',
    type: ReadinessResponseDto,
  })
  getReady() {
    return this.healthService.getReady();
  }
}
