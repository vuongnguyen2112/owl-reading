import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Chapter } from '@prisma/client';

export class ChapterResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  novelId!: string;

  @ApiProperty()
  chapterNumber!: number;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  previousChapterNumber?: number | null;

  @ApiPropertyOptional({ nullable: true })
  nextChapterNumber?: number | null;
}

interface ChapterNavigationOptions {
  previousChapterNumber?: number | null;
  nextChapterNumber?: number | null;
}

export function toChapterResponseDto(
  chapter: Chapter,
  navigation: ChapterNavigationOptions = {},
): ChapterResponseDto {
  return {
    id: chapter.id,
    novelId: chapter.novelId,
    chapterNumber: chapter.chapterNumber,
    title: chapter.title,
    content: chapter.content,
    createdAt: chapter.createdAt,
    updatedAt: chapter.updatedAt,
    ...navigation,
  };
}
