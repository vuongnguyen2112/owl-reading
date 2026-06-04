export interface PaginatedResponse<TItem> {
  items: TItem[];
  total: number;
  page: number;
  pageSize: number;
}

export function getPagination(page: number, pageSize: number) {
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function toPaginatedResponse<TItem>(
  items: TItem[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResponse<TItem> {
  return {
    items,
    total,
    page,
    pageSize,
  };
}
