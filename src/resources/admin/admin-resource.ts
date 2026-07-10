import type { HttpClient } from '../../http/http-client.js';
import type { AdminEntry } from '../../types/resources/index.js';
import type { ListParams, ListResult } from '../../types/pagination.js';
import { normalizePaginatedResponse } from '../../types/pagination.js';

export class AdminResource<T = AdminEntry> {
  constructor(
    protected readonly http: HttpClient,
    protected readonly path: string
  ) {}

  async list(params?: ListParams): Promise<ListResult<T>> {
    const response = await this.http.request<unknown>('GET', this.path, {
      params,
      operation: 'list',
    });
    return normalizePaginatedResponse<T>(response);
  }

  async get(id: number | string): Promise<T> {
    return this.http.request<T>('GET', `${this.path}/${id}`, {
      operation: 'get',
    });
  }

  async create(data: Record<string, unknown>): Promise<T> {
    const key = this.path.split('/').pop() ?? 'entry';
    const singular = key.replace(/s$/, '');
    return this.http.request<T>('POST', this.path, {
      body: { [singular]: data },
      operation: 'create',
    });
  }

  async update(id: number | string, data: Record<string, unknown>): Promise<T> {
    const key = this.path.split('/').pop() ?? 'entry';
    const singular = key.replace(/s$/, '');
    return this.http.request<T>('PUT', `${this.path}/${id}`, {
      body: { [singular]: data },
      operation: 'update',
    });
  }

  async delete(id: number | string): Promise<void> {
    await this.http.request<void>('DELETE', `${this.path}/${id}`, {
      operation: 'delete',
    });
  }
}

export class WebhooksAdminResource extends AdminResource<import('../../types/resources/index.js').Webhook> {
  async list(_params?: ListParams): Promise<ListResult<import('../../types/resources/index.js').Webhook>> {
    const response = await this.http.request<unknown>('GET', this.path, {
      operation: 'list',
    });
    if (response && typeof response === 'object' && 'webhooks' in response) {
      return { data: (response as { webhooks: import('../../types/resources/index.js').Webhook[] }).webhooks };
    }
    return normalizePaginatedResponse(response);
  }
}
