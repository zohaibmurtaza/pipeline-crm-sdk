import type { HttpClient } from '../http/http-client.js';
import type { ResolvedConfig } from '../types/config.js';
import type { Company } from '../types/resources/index.js';
import { BaseResource } from './base-resource.js';

export class CompaniesResource extends BaseResource<Company> {
  constructor(http: HttpClient, config: ResolvedConfig) {
    super(http, config, 'companies', 'companies', {
      searchEndpoint: true,
      searchMethod: 'GET',
      mergeable: true,
      listMethod: 'GET',
      wrapperKey: 'company',
      responseKey: 'companies',
    });
  }
}
