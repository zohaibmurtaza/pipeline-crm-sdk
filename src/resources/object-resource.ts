import type { HttpClient } from '../http/http-client.js';
import type { ResolvedConfig } from '../types/config.js';
import { BaseResource } from './base-resource.js';

export class ObjectResource<T = unknown> extends BaseResource<T> {
  constructor(
    http: HttpClient,
    config: ResolvedConfig,
    apiHandle: string,
    options: {
      mergeable?: boolean;
      wrapperKey?: string;
      listMethod?: 'GET' | 'POST';
    } = {}
  ) {
    super(http, config, apiHandle, apiHandle, {
      searchEndpoint: true,
      mergeable: options.mergeable ?? false,
      listMethod: options.listMethod ?? 'POST',
      searchPath: `${apiHandle}/search`,
      wrapperKey: options.wrapperKey,
    });
  }
}
