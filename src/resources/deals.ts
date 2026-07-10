import type { HttpClient } from '../http/http-client.js';
import type { ResolvedConfig } from '../types/config.js';
import type { Deal } from '../types/resources/index.js';
import { BaseResource } from './base-resource.js';

export class DealsResource extends BaseResource<Deal> {
  constructor(http: HttpClient, config: ResolvedConfig) {
    super(http, config, 'deals', 'deals', {
      searchEndpoint: true,
      mergeable: false,
      listMethod: 'GET',
      searchPath: 'deals/search',
      wrapperKey: 'deal',
    });
  }
}
