import type { HttpClient } from '../http/http-client.js';
import type { ResolvedConfig } from '../types/config.js';
import type { Document } from '../types/resources/index.js';
import { BaseResource } from './base-resource.js';

export class DocumentsResource extends BaseResource<Document> {
  constructor(http: HttpClient, config: ResolvedConfig) {
    super(http, config, 'documents', 'documents', {
      searchEndpoint: false,
      listMethod: 'GET',
    });
  }
}
