import { ApiProperty } from '@nestjs/swagger';

type BookmarkWithTarget = {
  id: string;
  novelId: string | null;
  chapterId: string | null;
  createdAt: Date;
  novel?: {
    id: string;
    slug: string;
    title: string;
  } | null;
  chapter?: {
    id: string;
    chapterNumber: number;
    title: string;
    novel: {
      id: string;
      slug: string;
      title: string;
    };
  } | null;
};

export class BookmarkResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ nullable: true })
  novelId!: string | null;

  @ApiProperty({ nullable: true })
  novelSlug!: string | null;

  @ApiProperty({ nullable: true })
  novelTitle!: string | null;

  @ApiProperty({ nullable: true })
  chapterId!: string | null;

  @ApiProperty({ nullable: true })
  chapterNumber!: number | null;

  @ApiProperty({ nullable: true })
  chapterTitle!: string | null;

  @ApiProperty()
  createdAt!: Date;
}

export function toBookmarkResponseDto(
  bookmark: BookmarkWithTarget,
): BookmarkResponseDto {
  const novel = bookmark.novel ?? bookmark.chapter?.novel ?? null;

  return {
    id: bookmark.id,
    novelId: bookmark.novelId ?? bookmark.chapter?.novel.id ?? null,
    novelSlug: novel?.slug ?? null,
    novelTitle: novel?.title ?? null,
    chapterId: bookmark.chapterId,
    chapterNumber: bookmark.chapter?.chapterNumber ?? null,
    chapterTitle: bookmark.chapter?.title ?? null,
    createdAt: bookmark.createdAt,
  };
}
