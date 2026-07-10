import type { HttpClient } from '../http/http-client.js';
import type { ResolvedConfig } from '../types/config.js';
import type { Lead } from '../types/resources/index.js';
import { BaseResource } from './base-resource.js';

export class LeadsResource extends BaseResource<Lead> {
  constructor(http: HttpClient, config: ResolvedConfig) {
    super(http, config, 'leads', 'leads', {
      searchEndpoint: false,
      searchMethod: 'GET',
      listMethod: 'GET',
      wrapperKey: 'lead',
      responseKey: 'leads',
    });
  }
}
