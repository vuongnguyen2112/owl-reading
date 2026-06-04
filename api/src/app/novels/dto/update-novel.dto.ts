import { NovelStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateNovelDto {
  @ApiPropertyOptional({ example: 'The Clockwork Owl' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'the-clockwork-owl' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(220)
  slug?: string;

  @ApiPropertyOptional({
    example: 'A young archivist follows a mechanical owl.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/covers/the-clockwork-owl.jpg',
  })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(1000)
  coverImageUrl?: string;

  @ApiPropertyOptional({ enum: NovelStatus })
  @IsOptional()
  @IsEnum(NovelStatus)
  status?: NovelStatus;
}
