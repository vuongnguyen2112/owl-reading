import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class CreateBookmarkDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  novelId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  chapterId?: string;
}
