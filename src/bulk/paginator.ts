import type { HttpClient } from '../http/http-client.js';
import type { ResolvedConfig, Transformer } from '../types/config.js';
import type { BulkOptions } from '../types/pagination.js';
import { getTotalPages, normalizePaginatedResponse } from '../types/pagination.js';
import { applyTransformerToArray } from '../utils/transform.js';

export interface PaginatorContext {
  resourcePath: string;
  resourceName: string;
  searchPath?: string;
  listPath?: string;
  listMethod?: 'GET' | 'POST';
  searchMethod?: 'GET' | 'POST';
  responseKey?: string;
  scopedTransformer?: Transformer;
}

export async function fetchAllPages<T>(
  http: HttpClient,
  config: ResolvedConfig,
  ctx: PaginatorContext,
  options: BulkOptions<T> = {}
): Promise<T[]> {
  const results: T[] = [];
  for await (const item of iteratePages<T>(http, config, ctx, options)) {
    results.push(item);
  }
  return results;
}

export async function* iteratePages<T>(
  http: HttpClient,
  config: ResolvedConfig,
  ctx: PaginatorContext,
  options: BulkOptions<T> = {}
): AsyncGenerator<T, void, undefined> {
  const concurrency = options.concurrency ?? 1;
  const perPage = options.per_page ?? 200;
  const useSearch = Boolean(
    options.query || options.sort || options.columns || options.conditions || options.search
  );
  const transformer = options.transformer ?? ctx.scopedTransformer;

  const firstPage = await fetchPage<T>(http, config, ctx, { ...options, page: 1, per_page: perPage }, useSearch);
  const totalPages = getTotalPages(firstPage.pagination, firstPage.data.length);
  options.onPage?.(1, totalPages);

  const processPage = async (pageResult: { data: T[]; page: number }) => {
    const transformCtx = {
      resource: ctx.resourceName,
      operation: 'search' as const,
      page: pageResult.page,
    };
    const transformed = await applyTransformerToArray(
      pageResult.data,
      transformCtx,
      config,
      transformer
    );
    return transformed;
  };

  const firstTransformed = await processPage({ data: firstPage.data, page: 1 });
  for (const item of firstTransformed) {
    yield item as T;
  }

  if (totalPages <= 1) return;

  const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);

  if (concurrency <= 1) {
    for (const page of remainingPages) {
      const pageResult = await fetchPage<T>(
        http,
        config,
        ctx,
        { ...options, page, per_page: perPage },
        useSearch
      );
      options.onPage?.(page, totalPages);
      const transformed = await processPage({ data: pageResult.data, page });
      for (const item of transformed) {
        yield item as T;
      }
    }
    return;
  }

  const pageResults = await fetchPagesParallel<T>(
    http,
    config,
    ctx,
    remainingPages,
    { ...options, per_page: perPage },
    useSearch,
    concurrency,
    (page, total) => options.onPage?.(page, total)
  );

  pageResults.sort((a, b) => a.page - b.page);
  for (const pageResult of pageResults) {
    const transformed = await processPage(pageResult);
    for (const item of transformed) {
      yield item as T;
    }
  }
}

async function fetchPagesParallel<T>(
  http: HttpClient,
  config: ResolvedConfig,
  ctx: PaginatorContext,
  pages: number[],
  options: BulkOptions<T>,
  useSearch: boolean,
  concurrency: number,
  onPage?: (page: number, total: number) => void
): Promise<Array<{ data: T[]; page: number }>> {
  const results: Array<{ data: T[]; page: number }> = [];
  let index = 0;

  async function worker(): Promise<void> {
    while (index < pages.length) {
      const current = index++;
      const page = pages[current]!;
      const pageResult = await fetchPage<T>(http, config, ctx, { ...options, page }, useSearch);
      onPage?.(page, pages.length + 1);
      results.push({ data: pageResult.data, page });
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, pages.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function fetchPage<T>(
  http: HttpClient,
  _config: ResolvedConfig,
  ctx: PaginatorContext,
  options: BulkOptions<T>,
  useSearch: boolean
): Promise<{ data: T[]; pagination?: import('../types/pagination.js').Pagination }> {
  const { concurrency, transformer, onPage, ...params } = options;

  if (useSearch && ctx.searchMethod === 'POST') {
    const path = ctx.searchPath ?? `${ctx.resourcePath}/search`;
    const body = buildSearchBody(params);
    const response = await http.request<unknown>('POST', path, {
      body,
      operation: 'search',
      page: params.page,
    });
    return normalizePaginatedResponse<T>(response, ctx.responseKey);
  }

  const path = ctx.listPath ?? ctx.resourcePath;
  const method = ctx.listMethod ?? 'GET';
  const requestParams = useSearch ? buildListParamsFromSearchOptions(params) : params;

  if (method === 'POST') {
    const body = buildSearchBody(requestParams);
    const response = await http.request<unknown>('POST', path, {
      body,
      operation: useSearch ? 'search' : 'list',
      page: params.page,
    });
    return normalizePaginatedResponse<T>(response, ctx.responseKey);
  }

  const response = await http.request<unknown>('GET', path, {
    params: requestParams,
    operation: useSearch ? 'search' : 'list',
    page: params.page,
  });
  return normalizePaginatedResponse<T>(response, ctx.responseKey);
}

function buildListParamsFromSearchOptions(params: BulkOptions): Record<string, unknown> {
  const { query, sort, columns, concurrency, transformer, onPage, ...rest } = params;
  const listParams: Record<string, unknown> = { ...rest };

  if (query) {
    listParams.conditions = query;
  }

  if (sort) {
    const descending = sort.startsWith('-');
    const sortField = descending ? sort.slice(1) : sort;
    listParams.sort_by = sortField;
    listParams.sort_direction = descending ? 'desc' : 'asc';
  }

  if (columns) {
    listParams.columns = columns;
  }

  return listParams;
}

function buildSearchBody(params: BulkOptions): Record<string, unknown> {
  const { query, sort, columns, page, per_page, search, sort_by, sort_direction, conditions, ...rest } = params;
  return {
    ...(query ? { query } : {}),
    ...(sort ? { sort } : {}),
    ...(columns ? { columns } : {}),
    ...(page !== undefined ? { page } : {}),
    ...(per_page !== undefined ? { per_page } : {}),
    ...(search ? { search } : {}),
    ...(sort_by ? { sort_by } : {}),
    ...(sort_direction ? { sort_direction } : {}),
    ...(conditions ? { conditions } : {}),
    ...rest,
  };
}
