export const NOVEL_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;

export type NovelStatus = (typeof NOVEL_STATUSES)[number];

export interface TimestampedModel {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserModel extends TimestampedModel {
  email: string;
  displayName: string | null;
}

export interface NovelModel extends TimestampedModel {
  title: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  status: NovelStatus;
}

export interface ChapterModel extends TimestampedModel {
  novelId: string;
  chapterNumber: number;
  title: string;
  content: string;
}

export interface BookmarkModel {
  id: string;
  userId: string;
  chapterId: string;
  createdAt: string;
}

export interface ReadingProgressModel {
  id: string;
  userId: string;
  novelId: string;
  chapterId: string;
  lastReadAt: string;
}

export interface PaginatedResult<TItem> {
  items: TItem[];
  total: number;
  page: number;
  pageSize: number;
}
