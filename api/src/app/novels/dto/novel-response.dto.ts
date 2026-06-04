import { Novel, NovelStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NovelResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ nullable: true })
  coverImageUrl!: string | null;

  @ApiProperty({ enum: NovelStatus })
  status!: NovelStatus;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export function toNovelResponseDto(novel: Novel): NovelResponseDto {
  return {
    id: novel.id,
    title: novel.title,
    slug: novel.slug,
    description: novel.description,
    coverImageUrl: novel.coverImageUrl,
    status: novel.status,
    createdAt: novel.createdAt,
    updatedAt: novel.updatedAt,
  };
}
