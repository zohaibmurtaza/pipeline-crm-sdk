import type { HttpClient } from '../http/http-client.js';
import type { ResolvedConfig } from '../types/config.js';
import type { Search } from '../types/resources/index.js';
import { BaseResource } from './base-resource.js';

export class SearchesResource extends BaseResource<Search> {
  constructor(http: HttpClient, config: ResolvedConfig) {
    super(http, config, 'searches', 'searches', {
      searchEndpoint: false,
      listMethod: 'GET',
      wrapperKey: 'search',
    });
  }
}
