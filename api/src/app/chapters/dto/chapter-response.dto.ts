import { ApiProperty } from '@nestjs/swagger';
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
}

export function toChapterResponseDto(chapter: Chapter): ChapterResponseDto {
  return {
    id: chapter.id,
    novelId: chapter.novelId,
    chapterNumber: chapter.chapterNumber,
    title: chapter.title,
    content: chapter.content,
    createdAt: chapter.createdAt,
    updatedAt: chapter.updatedAt,
  };
}
