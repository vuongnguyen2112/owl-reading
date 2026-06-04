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

export interface ListNovelsParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface ListChaptersParams {
  page?: number;
  pageSize?: number;
}
