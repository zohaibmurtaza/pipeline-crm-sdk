export interface Pagination {
  page: number;
  pages: number;
  per_page: number;
  total: number;
}

export interface PaginatedResponse<T> {
  pagination?: Pagination;
  entries?: T[];
}

export interface ListParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  conditions?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SearchParams extends ListParams {
  query?: Record<string, unknown>;
  sort?: string;
  columns?: string[];
}

export interface BulkOptions<TIn = unknown, TOut = TIn> extends SearchParams {
  concurrency?: number;
  transformer?: (data: TIn, ctx: import('./config.js').TransformContext) => TOut | Promise<TOut>;
  onPage?: (page: number, totalPages: number) => void;
}

export interface ListResult<T> {
  data: T[];
  pagination?: Pagination;
}

export function normalizePaginatedResponse<T>(body: unknown): ListResult<T> {
  if (Array.isArray(body)) {
    return { data: body as T[] };
  }

  if (body && typeof body === 'object') {
    const obj = body as Record<string, unknown>;
    if (Array.isArray(obj.entries)) {
      return {
        data: obj.entries as T[],
        pagination: obj.pagination as Pagination | undefined,
      };
    }
    if (Array.isArray(obj.data)) {
      return {
        data: obj.data as T[],
        pagination: obj.pagination as Pagination | undefined,
      };
    }
    if (Array.isArray(obj.webhooks)) {
      return { data: obj.webhooks as T[] };
    }
  }

  return { data: [] };
}

export function getTotalPages(pagination?: Pagination, fallbackDataLength = 0): number {
  if (pagination?.pages) return pagination.pages;
  if (pagination?.total && pagination?.per_page) {
    return Math.ceil(pagination.total / pagination.per_page);
  }
  return fallbackDataLength > 0 ? 1 : 0;
}
