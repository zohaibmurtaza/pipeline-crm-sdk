import type { HttpClient } from '../http/http-client.js';
import type { ResolvedConfig } from '../types/config.js';
import type { Activity } from '../types/resources/index.js';
import { BaseResource } from './base-resource.js';

export class ActivitiesResource extends BaseResource<Activity> {
  constructor(http: HttpClient, config: ResolvedConfig) {
    super(http, config, 'activities', 'activities', {
      searchEndpoint: false,
      listMethod: 'GET',
    });
  }
}
