import type { HttpClient } from '../http/http-client.js';

export class FieldsResource {
  constructor(private readonly http: HttpClient) {}

  for(relatedToType: string): FieldsForResource {
    return new FieldsForResource(this.http, relatedToType);
  }
}

export class FieldsForResource {
  constructor(
    private readonly http: HttpClient,
    private readonly relatedToType: string
  ) {}

  async all(): Promise<unknown> {
    return this.http.request<unknown>('GET', `${this.relatedToType}/all_fields`, {
      operation: 'list',
    });
  }
}
