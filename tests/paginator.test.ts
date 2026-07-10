import { describe, it, expect, vi } from 'vitest';
import { fetchAllPages } from '../src/bulk/paginator.js';
import { HttpClient } from '../src/http/http-client.js';
import { resolveConfig } from '../src/types/config.js';

function createPaginatedFetch(totalPages: number, perPage: number) {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    const urlObj = new URL(url);
    const page = Number(body.page ?? urlObj.searchParams.get('page') ?? 1);
    const startId = (page - 1) * perPage + 1;
    const entries = Array.from({ length: perPage }, (_, i) => ({
      id: startId + i,
      name: `Item ${startId + i}`,
    }));

    return {
      ok: true,
      status: 200,
      headers: { get: () => null },
      text: async () =>
        JSON.stringify({
          pagination: { page, pages: totalPages, per_page: perPage, total: totalPages * perPage },
          entries,
        }),
    } as Response;
  });
}

describe('paginator', () => {
  it('fetchAllPages retrieves all pages sequentially', async () => {
    const fetch = createPaginatedFetch(3, 2);
    const config = resolveConfig({
      apiKey: 'key',
      appKey: 'app',
      fetch,
      retries: { max: 0 },
    });
    const http = new HttpClient(config);

    const results = await fetchAllPages<{ id: number; name: string }>(
      http,
      config,
      {
        resourcePath: 'companies',
        resourceName: 'companies',
        searchPath: 'companies/search',
      },
      { per_page: 2, concurrency: 1 }
    );

    expect(results).toHaveLength(6);
    expect(results[0]!.id).toBe(1);
    expect(results[5]!.id).toBe(6);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('fetchAllPages fetches pages in parallel when concurrency > 1', async () => {
    const fetch = createPaginatedFetch(4, 1);
    const config = resolveConfig({
      apiKey: 'key',
      appKey: 'app',
      fetch,
      retries: { max: 0 },
    });
    const http = new HttpClient(config);

    const results = await fetchAllPages<{ id: number; name: string }>(
      http,
      config,
      {
        resourcePath: 'companies',
        resourceName: 'companies',
        searchPath: 'companies/search',
      },
      { per_page: 1, concurrency: 3 }
    );

    expect(results).toHaveLength(4);
    expect(fetch).toHaveBeenCalledTimes(4);
  });

  it('applies transformer to each record', async () => {
    const fetch = createPaginatedFetch(1, 2);
    const config = resolveConfig({
      apiKey: 'key',
      appKey: 'app',
      fetch,
      retries: { max: 0 },
    });
    const http = new HttpClient(config);

    const results = await fetchAllPages<{ id: number; label: string }>(
      http,
      config,
      {
        resourcePath: 'companies',
        resourceName: 'companies',
        searchPath: 'companies/search',
      },
      {
        per_page: 2,
        transformer: (item) => ({
          id: (item as { id: number }).id,
          label: `Company ${(item as { id: number }).id}`,
        }),
      }
    );

    expect(results[0]!.label).toBe('Company 1');
    expect(results[1]!.label).toBe('Company 2');
  });
});
