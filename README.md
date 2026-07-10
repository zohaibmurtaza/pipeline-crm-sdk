# @zohaibm/pipeline-crm-sdk

A fast, TypeScript-first JavaScript SDK for the [Pipeline CRM REST API v3](https://app.pipelinecrm.com/api/docs). Built for CRM migrations, data sync, and automation workflows.

## Features

- **Resource-oriented API** — `crm.companies.list()`, `crm.objects.deals.search()`, `crm.admin.dealStages.list()`
- **TypeScript + JavaScript** — full type definitions included
- **Configurable retries** — exponential backoff on 408, 429, 5xx
- **Rate limiting** — concurrency and requests-per-second controls
- **Parallel bulk fetching** — `listAll()` and `iterate()` with configurable concurrency
- **Transformers** — map records during fetch for migration pipelines
- **Broad API coverage** — companies, deals, people, leads, notes, calendar, admin, and custom objects

## Requirements

- Node.js 18+

## Installation

```bash
npm install @zohaibm/pipeline-crm-sdk
```

## Quick Start

```typescript
import { PipelineCRM } from '@zohaibm/pipeline-crm-sdk';

const crm = new PipelineCRM({
  apiKey: process.env.PIPELINE_CRM_API_KEY!,
  appKey: process.env.PIPELINE_CRM_APP_KEY!,
});

// List companies
const { data: companies } = await crm.companies.list({ page: 1, per_page: 50 });
console.log(companies);

// Get a single deal
const deal = await crm.deals.get(123);
console.log(deal.name, deal.value);
```

## Authentication

Pipeline CRM uses two credentials:

| Credential | Where to find it |
|------------|------------------|
| **App Key** | Settings → API → API Integrations |
| **API Key** | Settings → API → API Keys |

Both are sent as query parameters on every request (Pipeline CRM's official auth method).

```typescript
const crm = new PipelineCRM({
  apiKey: 'your-api-key',
  appKey: 'your-app-key',
});

// Or via environment variables in your app
const crm = new PipelineCRM({
  apiKey: process.env.PIPELINE_CRM_API_KEY!,
  appKey: process.env.PIPELINE_CRM_APP_KEY!,
});
```

## Configuration

```typescript
const crm = new PipelineCRM({
  apiKey: '...',
  appKey: '...',

  // Request timeout in ms (default: 30000)
  timeout: 60_000,

  // Retry policy
  retries: {
    max: 5,           // max retry attempts (default: 3)
    delay: 1000,      // initial delay in ms (default: 500)
    backoff: 2,       // exponential multiplier (default: 2)
    retryOn: [408, 429, 500, 502, 503, 504],
  },

  // Rate limiting
  rateLimit: {
    maxConcurrent: 5,   // max parallel requests (default: 5)
    maxPerSecond: 10,   // max requests per second (default: 10)
  },

  // Global transformer applied to all fetched records
  transformer: (record, ctx) => ({
    ...record,
    _source: 'pipeline',
    _resource: ctx.resource,
  }),

  // Custom base URL (default: https://api.pipelinecrm.com/api/v3)
  baseUrl: 'https://api.pipelinecrm.com/api/v3',

  // Optional: use Bearer auth header instead of query params
  useBearerAuth: false,
});
```

## API Structure

The SDK exposes two equivalent ways to access CRM objects:

```typescript
// Top-level shortcuts (recommended for common resources)
crm.companies.list()
crm.deals.search({ query: { deal_stage: [1, 2] } })
crm.people.get(456)

// Nested under objects (recommended for custom object types)
crm.objects.companies.update(1, { name: 'Updated' })
crm.objects.deals.listAll()
crm.objects.for('custom_object_handle').search({ query: {} })
```

### Core Resources

| SDK Path | HTTP Endpoint | Methods |
|----------|---------------|---------|
| `crm.companies` | `/companies` | list, search, get, create, update, delete, merge, listAll, iterate |
| `crm.deals` | `/deals` | list, search, get, create, update, listAll, iterate |
| `crm.people` | `/people` | list, search, get, create, update, delete, merge, listAll, iterate |
| `crm.contacts` | `/people` (alias) | same as people |
| `crm.leads` | `/leads` | list, get, create, update, delete, listAll, iterate |
| `crm.notes` | `/notes` | list, get, create, update, delete, listAll, iterate |
| `crm.activities` | `/activities` | list, listAll, iterate |
| `crm.calendarEntries` | `/calendar_entries` | list, get, create, update, delete, listAll, iterate |
| `crm.documents` | `/documents` | list, get, listAll, iterate |
| `crm.searches` | `/searches` | list, get, create, listAll, iterate |
| `crm.comments` | `/comments` | list, get, create, update, delete, listFor, createFor |
| `crm.objects.list()` | `GET /objects` | list available object types |
| `crm.objects.for(handle)` | `/api/v3/{handle}` | dynamic CRUD for any object type |

### Meta Resources

| SDK Path | HTTP Endpoint |
|----------|---------------|
| `crm.account.get()` | `GET /account` |
| `crm.users.list()` | `GET /users` |
| `crm.dropdowns.all()` | `GET /dropdowns/all` |
| `crm.fields.for('deals').all()` | `GET /deals/all_fields` |

### Admin Resources

| SDK Path | HTTP Endpoint |
|----------|---------------|
| `crm.admin.dealStages` | `/admin/deal_stages` |
| `crm.admin.dealLossReasons` | `/admin/deal_loss_reasons` |
| `crm.admin.dealWonReasons` | `/admin/deal_won_reasons` |
| `crm.admin.noteCategories` | `/admin/note_categories` |
| `crm.admin.webhooks` | `/admin/webhooks` |
| `crm.admin.productLines` | `/admin/product_lines` |
| `crm.admin.revenueTypes` | `/admin/revenue_types` |
| `crm.admin.predefinedContactsTags` | `/admin/predefined_contacts_tags` |
| `crm.admin.personCustomFieldLabels` | `/admin/person_custom_field_labels` |
| `crm.admin.personCustomFieldGroups` | `/admin/person_custom_field_groups` |
| `crm.admin.dealCustomFieldGroups` | `/admin/deal_custom_field_groups` |
| `crm.admin.companyCustomFieldGroups` | `/admin/company_custom_field_groups` |
| `crm.admin.todoTemplates` | `/admin/todo_templates` |

## Search and Filtering

Pipeline CRM uses **GET list endpoints with query parameters** for search/filtering (not `POST /resource/search`).

```typescript
// String shorthand
const { data: companies } = await crm.companies.search('Acme');

// Object form with pagination
const { data: companies } = await crm.companies.search({
  search: 'Acme',
  per_page: 50,
  page: 1,
});

// Advanced filter via conditions
const { data: deals } = await crm.deals.search({
  query: { deal_name: 'Partnership', deal_stage: [123, 124] },
});
```

`search()` maps to `GET /{resource}` with `search`, `conditions`, `sort_by`, and pagination params.

Query condition syntax follows Pipeline CRM's API:

```typescript
{ deal_name: 'Cars', deal_stage: [123, 124, 125] }
{ person_name: 'James', person_email: '@acme.com' }
```

## Pagination

### Manual pagination

```typescript
const page1 = await crm.companies.list({ page: 1, per_page: 200 });
console.log(page1.pagination); // { page, pages, per_page, total }
console.log(page1.data);
```

### Fetch all pages

```typescript
const allCompanies = await crm.companies.listAll({
  per_page: 200,
  concurrency: 5,  // fetch 5 pages in parallel
  onPage: (page, total) => console.log(`Fetching page ${page}/${total}`),
});
```

### Stream records (memory-efficient)

```typescript
for await (const person of crm.people.iterate({ per_page: 200 })) {
  await migratePerson(person);
}
```

## Transformers

Transformers let you map Pipeline CRM records during fetch — ideal for migration tools.

### Global transformer

```typescript
const crm = new PipelineCRM({
  apiKey: '...',
  appKey: '...',
  transformer: (record, ctx) => ({
    ...record,
    _pipelineResource: ctx.resource,
    _pipelineOperation: ctx.operation,
  }),
});
```

### Resource-scoped transformer

```typescript
const mappedDeals = crm.deals.withTransformer((deal) => ({
  externalId: String(deal.id),
  title: deal.name,
  amount: deal.value,
  stage: deal.deal_stage?.name,
}));
```

### Per-request transformer

```typescript
const deals = await crm.deals.listAll({
  transformer: (deal) => ({
    id: deal.id,
    name: deal.name,
    company: deal.company_name,
    customFields: deal.custom_fields,
  }),
});
```

## Migration Example

Export all CRM data for migration to another system:

```typescript
import { PipelineCRM } from '@zohaibm/pipeline-crm-sdk';

const crm = new PipelineCRM({
  apiKey: process.env.PIPELINE_CRM_API_KEY!,
  appKey: process.env.PIPELINE_CRM_APP_KEY!,
  timeout: 60_000,
  retries: { max: 5, delay: 1000, backoff: 2 },
  rateLimit: { maxConcurrent: 5, maxPerSecond: 10 },
});

// Fetch multiple resources in parallel
const { companies, deals, people } = await crm.bulk.fetchMany({
  companies: crm.companies,
  deals: crm.deals,
  people: crm.people,
}, {
  per_page: 200,
  concurrency: 5,
  transformer: (record, ctx) => ({
    sourceId: (record as { id: number }).id,
    resource: ctx.resource,
    data: record,
  }),
});

// Or stream large datasets
for await (const deal of crm.deals.iterate({
  concurrency: 5,
  transformer: (d) => ({
    externalId: String(d.id),
    title: d.name,
    amount: d.value,
    stage: d.deal_stage?.name,
    company: d.company_name,
    customFields: d.custom_fields,
  }),
})) {
  await targetCrm.deals.create(deal);
}
```

## CRUD Examples

### Create a company

```typescript
const company = await crm.companies.create(
  { name: 'Acme Inc', email: 'info@acme.com', web: 'https://acme.com' },
  { check_for_duplicates: true }
);
```

### Update a deal

```typescript
const deal = await crm.deals.update(123, {
  name: 'Updated Deal',
  value: 75000,
  deal_stage_id: 2,
});
```

### Merge duplicate companies

```typescript
await crm.companies.merge(sourceCompanyId, destinationCompanyId);
```

### Create a note on a deal

```typescript
const note = await crm.notes.create({
  title: 'Follow-up call',
  content: 'Discussed pricing options.',
  deal_id: 123,
});
```

### Nested comments

```typescript
const comments = await crm.comments.listFor('deals', 123);
await crm.comments.createFor('deals', 123, { content: 'Great progress!' });
```

## Error Handling

The SDK throws typed errors for different failure modes:

```typescript
import {
  PipelineCRM,
  PipelineCRMError,
  PipelineCRMAuthError,
  PipelineCRMRateLimitError,
  PipelineCRMValidationError,
  PipelineCRMNotFoundError,
} from '@zohaibm/pipeline-crm-sdk';

try {
  await crm.companies.get(999);
} catch (error) {
  if (error instanceof PipelineCRMAuthError) {
  console.error('Check your API key and App key');
  } else if (error instanceof PipelineCRMNotFoundError) {
    console.error('Company not found');
  } else if (error instanceof PipelineCRMRateLimitError) {
    console.error(`Rate limited. Retry after ${error.retryAfter}ms`);
  } else if (error instanceof PipelineCRMValidationError) {
    console.error('Validation failed:', error.body);
  } else if (error instanceof PipelineCRMError) {
    console.error(`API error ${error.status}:`, error.message);
  }
}
```

All errors include:
- `status` — HTTP status code
- `endpoint` — the URL that was called
- `body` — parsed API error response
- `requestId` — if provided by the API

## TypeScript

Full types are exported:

```typescript
import {
  PipelineCRM,
  type Company,
  type Deal,
  type Person,
  type Lead,
  type PipelineCRMConfig,
  type BulkOptions,
  type Transformer,
} from '@zohaibm/pipeline-crm-sdk';

const crm = new PipelineCRM({ apiKey: '...', appKey: '...' });

const company: Company = await crm.companies.get(1);
const deals: Deal[] = await crm.deals.listAll();
```

### Raw request escape hatch

For undocumented or beta endpoints:

```typescript
const result = await crm.request<MyType>('GET', 'custom_endpoint', {
  params: { filter: 'active' },
});
```

## JavaScript Usage

Works without TypeScript — types are available via IDE IntelliSense:

```javascript
const { PipelineCRM } = require('@zohaibm/pipeline-crm-sdk');

const crm = new PipelineCRM({
  apiKey: process.env.PIPELINE_CRM_API_KEY,
  appKey: process.env.PIPELINE_CRM_APP_KEY,
});

const companies = await crm.companies.listAll();
```

## API Reference Summary

| SDK Method | HTTP |
|------------|------|
| `resource.list(params?)` | `GET /{resource}` or `POST /{resource}/search` |
| `resource.search(params)` | `GET /{resource}` with filter query params |
| `resource.get(id)` | `GET /{resource}/{id}` |
| `resource.create(data, opts?)` | `POST /{resource}` |
| `resource.update(id, data, opts?)` | `PUT /{resource}/{id}` |
| `resource.delete(id)` | `DELETE /{resource}/{id}` |
| `resource.merge(src, dest)` | `POST /{resource}/{src}/merge/{dest}` |
| `resource.listAll(opts?)` | Auto-paginated fetch |
| `resource.iterate(opts?)` | Async generator over all records |
| `crm.request(method, path, opts?)` | Raw API call |

## License

MIT
