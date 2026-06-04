import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SaveReadingProgressDto {
  @ApiProperty()
  @IsUUID()
  novelId!: string;

  @ApiProperty()
  @IsUUID()
  chapterId!: string;
}
