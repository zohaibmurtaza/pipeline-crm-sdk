import { describe, it, expect, vi } from 'vitest';
import { PipelineCRM } from '../src/client.js';

function createMockFetch() {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';

    if (url.includes('/companies/1') && method === 'GET') {
      return mockResponse(200, { id: 1, name: 'Acme Corp' });
    }

    if (url.includes('/companies') && method === 'GET') {
      return mockResponse(200, {
        pagination: { page: 1, pages: 1, per_page: 20, total: 1 },
        entries: [{ id: 1, name: 'Acme Corp' }],
      });
    }

    if (url.includes('/companies') && method === 'POST') {
      const body = JSON.parse(String(init?.body));
      return mockResponse(200, { id: 2, ...body.company });
    }

    if (url.includes('/deals/search') && method === 'POST') {
      return mockResponse(200, {
        pagination: { page: 1, pages: 1, per_page: 20, total: 1 },
        entries: [{ id: 10, name: 'Big Deal', value: 50000 }],
      });
    }

    if (url.includes('/objects') && method === 'GET') {
      return mockResponse(200, {
        entries: [{ api_handle: 'companies', name: 'Companies' }],
      });
    }

    return mockResponse(404, { error: 'Not found' });
  });
}

function mockResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    text: async () => JSON.stringify(body),
  } as Response;
}

describe('PipelineCRM resources', () => {
  it('creates client with top-level shortcuts', () => {
    const crm = new PipelineCRM({
      apiKey: 'key',
      appKey: 'app',
      fetch: createMockFetch(),
      retries: { max: 0 },
    });

    expect(crm.companies).toBe(crm.objects.companies);
    expect(crm.deals).toBe(crm.objects.deals);
    expect(crm.people).toBe(crm.objects.people);
    expect(crm.contacts).toBe(crm.objects.people);
  });

  it('lists companies', async () => {
    const crm = new PipelineCRM({
      apiKey: 'key',
      appKey: 'app',
      fetch: createMockFetch(),
      retries: { max: 0 },
    });

    const result = await crm.companies.list();
    expect(result.data).toHaveLength(1);
    expect(result.data[0]!.name).toBe('Acme Corp');
  });

  it('gets a single company', async () => {
    const crm = new PipelineCRM({
      apiKey: 'key',
      appKey: 'app',
      fetch: createMockFetch(),
      retries: { max: 0 },
    });

    const company = await crm.companies.get(1);
    expect(company.name).toBe('Acme Corp');
  });

  it('creates a company with wrapped payload', async () => {
    const fetch = createMockFetch();
    const crm = new PipelineCRM({
      apiKey: 'key',
      appKey: 'app',
      fetch,
      retries: { max: 0 },
    });

    const company = await crm.companies.create({ name: 'New Co' });
    expect(company.name).toBe('New Co');

    const body = JSON.parse(String(fetch.mock.calls.find((c) => c[1]?.method === 'POST')?.[1]?.body));
    expect(body.company).toEqual({ name: 'New Co' });
  });

  it('searches deals via objects namespace', async () => {
    const crm = new PipelineCRM({
      apiKey: 'key',
      appKey: 'app',
      fetch: createMockFetch(),
      retries: { max: 0 },
    });

    const result = await crm.objects.deals.search({
      query: { deal_name: 'Big' },
    });
    expect(result.data[0]!.name).toBe('Big Deal');
  });

  it('lists available object types', async () => {
    const crm = new PipelineCRM({
      apiKey: 'key',
      appKey: 'app',
      fetch: createMockFetch(),
      retries: { max: 0 },
    });

    const types = await crm.objects.list();
    expect(types[0]!.api_handle).toBe('companies');
  });

  it('bulk.fetch delegates to resource listAll', async () => {
    const fetch = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('/companies/search') || (url.includes('/companies') && init?.method !== 'POST')) {
        return mockResponse(200, {
          pagination: { page: 1, pages: 1, per_page: 20, total: 1 },
          entries: [{ id: 1, name: 'Acme' }],
        });
      }
      return mockResponse(404, {});
    });

    const crm = new PipelineCRM({
      apiKey: 'key',
      appKey: 'app',
      fetch,
      retries: { max: 0 },
    });

    const companies = await crm.bulk.fetch(crm.companies);
    expect(companies).toHaveLength(1);
  });
});
