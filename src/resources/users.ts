import type { HttpClient } from '../http/http-client.js';
import type { ListParams, ListResult } from '../types/pagination.js';
import type { User } from '../types/resources/index.js';
import { normalizePaginatedResponse } from '../types/pagination.js';

export class UsersResource {
  constructor(private readonly http: HttpClient) {}

  async list(params?: ListParams): Promise<ListResult<User>> {
    const response = await this.http.request<unknown>('GET', 'users', {
      params,
      operation: 'list',
    });
    return normalizePaginatedResponse<User>(response);
  }

  async get(id: number | string): Promise<User> {
    return this.http.request<User>('GET', `users/${id}`, { operation: 'get' });
  }
}
