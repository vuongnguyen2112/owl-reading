import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CHAPTER_CONTENT_MAX_LENGTH } from './chapter-content-limits';

export class UpdateChapterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  novelId?: string;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  chapterNumber?: number;

  @ApiPropertyOptional({ example: 'The Brass Feather' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(CHAPTER_CONTENT_MAX_LENGTH)
  content?: string;
}
