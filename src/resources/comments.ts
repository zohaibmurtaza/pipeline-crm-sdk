import type { HttpClient } from '../http/http-client.js';
import type { ResolvedConfig } from '../types/config.js';
import type { Comment } from '../types/resources/index.js';
import type { ListParams, ListResult } from '../types/pagination.js';
import { normalizePaginatedResponse } from '../types/pagination.js';
import { BaseResource } from './base-resource.js';

export class CommentsResource extends BaseResource<Comment> {
  constructor(http: HttpClient, config: ResolvedConfig) {
    super(http, config, 'comments', 'comments', {
      searchEndpoint: false,
      listMethod: 'GET',
      wrapperKey: 'comment',
    });
  }

  async listFor(
    commentableType: string,
    commentableId: number | string,
    params?: ListParams
  ): Promise<ListResult<Comment>> {
    const path = `${commentableType}/${commentableId}/comments`;
    const response = await this.http.request<unknown>('GET', path, {
      params,
      operation: 'list',
    });
    const normalized = normalizePaginatedResponse<Comment>(response);
    return normalized;
  }

  async createFor(
    commentableType: string,
    commentableId: number | string,
    data: Record<string, unknown>
  ): Promise<Comment> {
    const path = `${commentableType}/${commentableId}/comments`;
    return this.http.request<Comment>('POST', path, {
      body: this.wrapPayload(data),
      operation: 'create',
    });
  }
}
