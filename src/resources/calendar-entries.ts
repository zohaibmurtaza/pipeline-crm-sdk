import type { HttpClient } from '../http/http-client.js';
import type { ResolvedConfig } from '../types/config.js';
import type { CalendarEntry } from '../types/resources/index.js';
import { BaseResource } from './base-resource.js';

export class CalendarEntriesResource extends BaseResource<CalendarEntry> {
  constructor(http: HttpClient, config: ResolvedConfig) {
    super(http, config, 'calendar_entries', 'calendar_entries', {
      searchEndpoint: false,
      listMethod: 'GET',
      wrapperKey: 'calendar_entry',
    });
  }
}
