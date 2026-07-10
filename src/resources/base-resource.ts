import type { HttpClient } from '../http/http-client.js';
import type { ResolvedConfig, Transformer } from '../types/config.js';
import type { BulkOptions, ListParams, ListResult, SearchParams } from '../types/pagination.js';
import { getTotalPages, normalizePaginatedResponse } from '../types/pagination.js';
import type { CreateOptions, UpdateOptions } from '../types/requests.js';
import { applyTransformerToArray } from '../utils/transform.js';
import { fetchAllPages, iteratePages } from '../bulk/paginator.js';

export interface ResourceOptions {
  searchEndpoint?: boolean;
  searchMethod?: 'GET' | 'POST';
  mergeable?: boolean;
  listMethod?: 'GET' | 'POST';
  listPath?: string;
  searchPath?: string;
  wrapperKey?: string;
  responseKey?: string;
}

export class BaseResource<T = unknown> {
  protected readonly http: HttpClient;
  protected readonly config: ResolvedConfig;
  protected readonly resourcePath: string;
  protected readonly resourceName: string;
  protected readonly options: ResourceOptions;
  protected readonly scopedTransformer?: Transformer;

  constructor(
    http: HttpClient,
    config: ResolvedConfig,
    resourcePath: string,
    resourceName: string,
    options: ResourceOptions = {},
    scopedTransformer?: Transformer
  ) {
    this.http = http;
    this.config = config;
    this.resourcePath = resourcePath;
    this.resourceName = resourceName;
    this.options = {
      searchEndpoint: true,
      searchMethod: 'POST',
      mergeable: false,
      listMethod: 'GET',
      ...options,
    };
    this.scopedTransformer = scopedTransformer;
  }

  withTransformer<TOut = T>(transformer: Transformer<T, TOut>): BaseResource<TOut> {
    return new BaseResource<TOut>(
      this.http,
      this.config,
      this.resourcePath,
      this.resourceName,
      this.options,
      transformer as Transformer
    );
  }

  async list(params?: ListParams): Promise<ListResult<T>> {
    const path = this.options.listPath ?? this.resourcePath;
    const method = this.options.listMethod ?? 'GET';

    let body: unknown;
    if (method === 'POST') {
      body = this.buildSearchBody(params);
    }

    const response = await this.http.request<unknown>(method, path, {
      params: method === 'GET' ? params : undefined,
      body: method === 'POST' ? body : undefined,
      operation: 'list',
    });

    const normalized = normalizePaginatedResponse<T>(response, this.options.responseKey);
    const ctx = { resource: this.resourceName, operation: 'list' as const };
    const data = await applyTransformerToArray(
      normalized.data,
      ctx,
      this.config,
      this.scopedTransformer
    );

    return { data: data as T[], pagination: normalized.pagination };
  }

  async search(params?: SearchParams | string): Promise<ListResult<T>> {
    const normalizedParams = normalizeSearchParams(params);

    if (this.options.searchMethod === 'GET') {
      return this.list(this.buildListParamsFromSearch(normalizedParams));
    }

    const path = this.options.searchPath ?? `${this.resourcePath}/search`;
    const body = this.buildSearchBody(normalizedParams);

    const response = await this.http.request<unknown>('POST', path, {
      body,
      operation: 'search',
      page: normalizedParams?.page,
    });

    const normalized = normalizePaginatedResponse<T>(response, this.options.responseKey);
    const ctx = {
      resource: this.resourceName,
      operation: 'search' as const,
      page: normalizedParams?.page,
    };
    const data = await applyTransformerToArray(
      normalized.data,
      ctx,
      this.config,
      this.scopedTransformer
    );

    return { data: data as T[], pagination: normalized.pagination };
  }

  async get(id: number | string): Promise<T> {
    return this.http.request<T>('GET', `${this.resourcePath}/${id}`, {
      operation: 'get',
      transformer: this.scopedTransformer,
    });
  }

  async create(data: Record<string, unknown>, options?: CreateOptions): Promise<T> {
    const body = this.wrapPayload(data);
    return this.http.request<T>('POST', this.resourcePath, {
      body,
      params: options,
      operation: 'create',
      transformer: this.scopedTransformer,
    });
  }

  async update(
    id: number | string,
    data: Record<string, unknown>,
    options?: UpdateOptions
  ): Promise<T> {
    const body = this.wrapPayload(data);
    return this.http.request<T>('PUT', `${this.resourcePath}/${id}`, {
      body,
      params: options,
      operation: 'update',
      transformer: this.scopedTransformer,
    });
  }

  async delete(id: number | string): Promise<void> {
    await this.http.request<void>('DELETE', `${this.resourcePath}/${id}`, {
      operation: 'delete',
    });
  }

  async merge(sourceId: number | string, destinationId: number | string): Promise<T> {
    if (!this.options.mergeable) {
      throw new Error(`Resource "${this.resourceName}" does not support merge.`);
    }
    return this.http.request<T>(
      'POST',
      `${this.resourcePath}/${sourceId}/merge/${destinationId}`,
      {
        operation: 'merge',
        transformer: this.scopedTransformer,
      }
    );
  }

  async listAll(options?: BulkOptions<T>): Promise<T[]> {
    return fetchAllPages<T>(
      this.http,
      this.config,
      {
        resourcePath: this.resourcePath,
        resourceName: this.resourceName,
        searchPath: this.options.searchPath,
        listPath: this.options.listPath,
        listMethod: this.options.listMethod,
        searchMethod: this.options.searchMethod,
        responseKey: this.options.responseKey,
        scopedTransformer: this.scopedTransformer,
      },
      options
    );
  }

  async *iterate(options?: BulkOptions<T>): AsyncGenerator<T, void, undefined> {
    yield* iteratePages<T>(
      this.http,
      this.config,
      {
        resourcePath: this.resourcePath,
        resourceName: this.resourceName,
        searchPath: this.options.searchPath,
        listPath: this.options.listPath,
        listMethod: this.options.listMethod,
        searchMethod: this.options.searchMethod,
        responseKey: this.options.responseKey,
        scopedTransformer: this.scopedTransformer,
      },
      options
    );
  }

  protected wrapPayload(data: Record<string, unknown>): Record<string, unknown> {
    if (this.options.wrapperKey) {
      return { [this.options.wrapperKey]: data };
    }
    const singular = this.resourceName.replace(/s$/, '');
    if (data[singular] || data[this.resourceName]) {
      return data;
    }
    return { [singular]: data };
  }

  protected buildSearchBody(params?: SearchParams): Record<string, unknown> {
    if (!params) return {};
    const { query, sort, columns, page, per_page, search, sort_by, sort_direction, conditions, concurrency, transformer, onPage, ...rest } = params;
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

  protected buildListParamsFromSearch(params?: SearchParams): ListParams {
    if (!params) return {};
    const { query, sort, columns, concurrency, transformer, onPage, ...rest } = params;

    const listParams: ListParams = { ...rest };

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
}

function normalizeSearchParams(params?: SearchParams | string): SearchParams | undefined {
  if (typeof params === 'string') {
    return { search: params };
  }
  return params;
}

export { getTotalPages };
