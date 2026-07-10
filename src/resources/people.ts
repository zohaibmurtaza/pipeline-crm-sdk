import type { HttpClient } from '../http/http-client.js';
import type { ResolvedConfig } from '../types/config.js';
import type { Person } from '../types/resources/index.js';
import { BaseResource } from './base-resource.js';

export class PeopleResource extends BaseResource<Person> {
  constructor(http: HttpClient, config: ResolvedConfig) {
    super(http, config, 'people', 'people', {
      searchEndpoint: true,
      mergeable: true,
      listMethod: 'GET',
      searchPath: 'people/search',
      wrapperKey: 'person',
    });
  }
}
