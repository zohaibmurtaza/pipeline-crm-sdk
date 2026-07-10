import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient } from '../src/http/http-client.js';
import { resolveConfig } from '../src/types/config.js';
import {
  PipelineCRMAuthError,
  PipelineCRMNotFoundError,
} from '../src/http/errors.js';

function createMockFetch(responses: Array<{ status: number; body: unknown; headers?: Record<string, string> }>) {
  let callIndex = 0;
  return vi.fn(async () => {
    const response = responses[callIndex] ?? responses[responses.length - 1]!;
    callIndex++;
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      headers: {
        get: (name: string) => response.headers?.[name] ?? null,
      },
      text: async () => JSON.stringify(response.body),
    } as Response;
  });
}

describe('HttpClient', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('attaches api_key and app_key as query params', async () => {
    const fetch = createMockFetch([{ status: 200, body: { id: 1 } }]);
    const client = new HttpClient(
      resolveConfig({
        apiKey: 'test-api-key',
        appKey: 'test-app-key',
        fetch,
        retries: { max: 0 },
      })
    );

    await client.request('GET', 'companies/1');

    const calledUrl = (fetch.mock.calls[0]![1] as RequestInit | undefined);
    expect(fetch).toHaveBeenCalledOnce();
    const url = String((fetch.mock.calls[0] as [string])[0] ?? fetch.mock.calls[0]);
    expect(url).toContain('api_key=test-api-key');
    expect(url).toContain('app_key=test-app-key');
    expect(calledUrl).toBeDefined();
  });

  it('throws PipelineCRMAuthError on 401', async () => {
    const fetch = createMockFetch([{ status: 401, body: { error: 'Unauthorized' } }]);
    const client = new HttpClient(
      resolveConfig({
        apiKey: 'bad',
        appKey: 'bad',
        fetch,
        retries: { max: 0 },
      })
    );

    await expect(client.request('GET', 'companies')).rejects.toBeInstanceOf(PipelineCRMAuthError);
  });

  it('throws PipelineCRMNotFoundError on 404', async () => {
    const fetch = createMockFetch([{ status: 404, body: { error: 'Not found' } }]);
    const client = new HttpClient(
      resolveConfig({
        apiKey: 'key',
        appKey: 'app',
        fetch,
        retries: { max: 0 },
      })
    );

    await expect(client.request('GET', 'companies/999')).rejects.toBeInstanceOf(
      PipelineCRMNotFoundError
    );
  });

  it('retries on 500 and eventually succeeds', async () => {
    const fetch = createMockFetch([
      { status: 500, body: { error: 'Server error' } },
      { status: 200, body: { id: 1, name: 'Acme' } },
    ]);
    const client = new HttpClient(
      resolveConfig({
        apiKey: 'key',
        appKey: 'app',
        fetch,
        retries: { max: 2, delay: 10, backoff: 1 },
      })
    );

    const promise = client.request<{ id: number; name: string }>('GET', 'companies/1');
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.name).toBe('Acme');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('applies global transformer', async () => {
    const fetch = createMockFetch([{ status: 200, body: { id: 1, name: 'Acme' } }]);
    const client = new HttpClient(
      resolveConfig({
        apiKey: 'key',
        appKey: 'app',
        fetch,
        retries: { max: 0 },
        transformer: (data) => ({ ...(data as object), transformed: true }),
      })
    );

    const result = await client.request<Record<string, unknown>>('GET', 'companies/1');
    expect(result.transformed).toBe(true);
  });
});
