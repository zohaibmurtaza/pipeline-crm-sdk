import type { HttpClient } from '../http/http-client.js';
import type { Account } from '../types/resources/index.js';

export class AccountResource {
  constructor(private readonly http: HttpClient) {}

  async get(): Promise<Account> {
    return this.http.request<Account>('GET', 'account', { operation: 'get' });
  }
}
