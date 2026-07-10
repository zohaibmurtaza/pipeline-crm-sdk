import { HttpClient } from './http/http-client.js';
import type { PipelineCRMConfig, ResolvedConfig } from './types/config.js';
import { resolveConfig } from './types/config.js';
import type { HttpMethod } from './types/config.js';
import type { RequestOptions } from './types/requests.js';
import { ObjectsRegistry } from './resources/objects-registry.js';
import { AdminNamespace } from './resources/admin/index.js';
import { AccountResource } from './resources/account.js';
import { UsersResource } from './resources/users.js';
import { DropdownsResource } from './resources/dropdowns.js';
import { FieldsResource } from './resources/fields.js';
import { BulkHelper } from './bulk/index.js';

export class PipelineCRM {
  readonly objects: ObjectsRegistry;
  readonly admin: AdminNamespace;
  readonly account: AccountResource;
  readonly users: UsersResource;
  readonly dropdowns: DropdownsResource;
  readonly fields: FieldsResource;
  readonly bulk: BulkHelper;

  readonly companies;
  readonly deals;
  readonly people;
  readonly contacts;
  readonly leads;
  readonly notes;
  readonly activities;
  readonly calendarEntries;
  readonly documents;
  readonly searches;
  readonly comments;

  private readonly http: HttpClient;
  private readonly config: ResolvedConfig;

  constructor(config: PipelineCRMConfig) {
    this.config = resolveConfig(config);
    this.http = new HttpClient(this.config);

    this.objects = new ObjectsRegistry(this.http, this.config);
    this.admin = new AdminNamespace(this.http, this.config);
    this.account = new AccountResource(this.http);
    this.users = new UsersResource(this.http);
    this.dropdowns = new DropdownsResource(this.http);
    this.fields = new FieldsResource(this.http);
    this.bulk = new BulkHelper();

    this.companies = this.objects.companies;
    this.deals = this.objects.deals;
    this.people = this.objects.people;
    this.contacts = this.objects.contacts;
    this.leads = this.objects.leads;
    this.notes = this.objects.notes;
    this.activities = this.objects.activities;
    this.calendarEntries = this.objects.calendarEntries;
    this.documents = this.objects.documents;
    this.searches = this.objects.searches;
    this.comments = this.objects.comments;
  }

  async request<T>(
    method: HttpMethod,
    path: string,
    options?: RequestOptions
  ): Promise<T> {
    return this.http.request<T>(method, path, options);
  }
}

export default PipelineCRM;
