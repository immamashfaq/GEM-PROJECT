import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@gem/config';

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

export interface PaginationResult {
  skip: number;
  take: number;
  page: number;
  pageSize: number;
}

export function getPaginationParams(options: PaginationOptions): PaginationResult {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, options.pageSize ?? DEFAULT_PAGE_SIZE));
  const skip = (page - 1) * pageSize;

  return { skip, take: pageSize, page, pageSize };
}

export function buildPaginationMeta(
  totalCount: number,
  page: number,
  pageSize: number,
) {
  const totalPages = Math.ceil(totalCount / pageSize);
  return {
    page,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
