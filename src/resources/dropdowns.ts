import type { HttpClient } from '../http/http-client.js';

export class DropdownsResource {
  constructor(private readonly http: HttpClient) {}

  async all(): Promise<unknown> {
    return this.http.request<unknown>('GET', 'dropdowns/all', { operation: 'list' });
  }
}
