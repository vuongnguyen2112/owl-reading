import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: 'ok';

  @ApiProperty({ example: '2026-05-30T11:30:00.000Z' })
  timestamp!: string;

  @ApiProperty({ example: 42.12 })
  uptime!: number;
}
