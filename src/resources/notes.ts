import type { HttpClient } from '../http/http-client.js';
import type { ResolvedConfig } from '../types/config.js';
import type { Note } from '../types/resources/index.js';
import { BaseResource } from './base-resource.js';

export class NotesResource extends BaseResource<Note> {
  constructor(http: HttpClient, config: ResolvedConfig) {
    super(http, config, 'notes', 'notes', {
      searchEndpoint: false,
      listMethod: 'GET',
      wrapperKey: 'note',
    });
  }
}
