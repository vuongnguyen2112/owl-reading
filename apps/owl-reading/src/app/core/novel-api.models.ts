export interface PaginatedResponse<TItem> {
  items: TItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Novel {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  novelId: string;
  chapterNumber: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingProgress {
  id: string;
  novelId: string;
  novelSlug: string;
  chapterId: string;
  chapterNumber: number;
  lastReadAt: string;
}

export interface Bookmark {
  id: string;
  novelId: string | null;
  novelSlug: string | null;
  novelTitle: string | null;
  chapterId: string | null;
  chapterNumber: number | null;
  chapterTitle: string | null;
  createdAt: string;
}

export interface ListNovelsParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface ListChaptersParams {
  page?: number;
  pageSize?: number;
}

export interface SaveReadingProgressRequest {
  novelId: string;
  chapterId: string;
}

export interface CreateBookmarkRequest {
  novelId?: string;
  chapterId?: string;
}
