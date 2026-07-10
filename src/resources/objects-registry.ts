import type { HttpClient } from '../http/http-client.js';
import type { ResolvedConfig } from '../types/config.js';
import type { ObjectType } from '../types/resources/index.js';
import { ObjectResource } from './object-resource.js';
import { CompaniesResource } from './companies.js';
import { DealsResource } from './deals.js';
import { PeopleResource } from './people.js';
import { LeadsResource } from './leads.js';
import { NotesResource } from './notes.js';
import { ActivitiesResource } from './activities.js';
import { CalendarEntriesResource } from './calendar-entries.js';
import { DocumentsResource } from './documents.js';
import { SearchesResource } from './searches.js';
import { CommentsResource } from './comments.js';

export class ObjectsRegistry {
  readonly companies: CompaniesResource;
  readonly deals: DealsResource;
  readonly people: PeopleResource;
  readonly contacts: PeopleResource;
  readonly leads: LeadsResource;
  readonly notes: NotesResource;
  readonly activities: ActivitiesResource;
  readonly calendarEntries: CalendarEntriesResource;
  readonly documents: DocumentsResource;
  readonly searches: SearchesResource;
  readonly comments: CommentsResource;

  private readonly http: HttpClient;
  private readonly config: ResolvedConfig;
  private readonly customCache = new Map<string, ObjectResource<unknown>>();

  constructor(http: HttpClient, config: ResolvedConfig) {
    this.http = http;
    this.config = config;
    this.companies = new CompaniesResource(http, config);
    this.deals = new DealsResource(http, config);
    this.people = new PeopleResource(http, config);
    this.contacts = this.people;
    this.leads = new LeadsResource(http, config);
    this.notes = new NotesResource(http, config);
    this.activities = new ActivitiesResource(http, config);
    this.calendarEntries = new CalendarEntriesResource(http, config);
    this.documents = new DocumentsResource(http, config);
    this.searches = new SearchesResource(http, config);
    this.comments = new CommentsResource(http, config);
  }

  async list(): Promise<ObjectType[]> {
    const response = await this.http.request<unknown>('GET', 'objects', {
      operation: 'list',
    });
    if (Array.isArray(response)) return response as ObjectType[];
    const obj = response as { entries?: ObjectType[] };
    return obj.entries ?? [];
  }

  for<T = unknown>(apiHandle: string): ObjectResource<T> {
    const cached = this.customCache.get(apiHandle);
    if (cached) return cached as ObjectResource<T>;
    const resource = new ObjectResource<T>(this.http, this.config, apiHandle);
    this.customCache.set(apiHandle, resource as ObjectResource<unknown>);
    return resource;
  }
}
