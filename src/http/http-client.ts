import type { HttpMethod, ResolvedConfig, TransformContext } from '../types/config.js';
import type { RequestOptions } from '../types/requests.js';
import { appendAuthToUrl, serializeParams } from '../utils/auth.js';
import { applyTransformer } from '../utils/transform.js';
import {
  PipelineCRMError,
  createPipelineCRMError,
  parseRetryAfterHeader,
} from './errors.js';
import { RateLimiter } from './rate-limiter.js';
import { withRetry } from './retry.js';

export class HttpClient {
  readonly config: ResolvedConfig;
  private readonly rateLimiter: RateLimiter;

  constructor(config: ResolvedConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(config.rateLimit);
  }

  async request<T>(
    method: HttpMethod,
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const endpoint = this.buildUrl(path, options.params);
    const resource = path.split('/').filter(Boolean)[0] ?? path;
    const ctx: TransformContext = {
      resource,
      operation: options.operation ?? mapMethodToOperation(method),
      page: options.page,
    };

    const result = await withRetry(
      () => this.executeRequest<T>(method, endpoint, options),
      this.config.retries,
      () => endpoint
    );

    if (options.transformer || this.config.transformer) {
      return applyTransformer(result, ctx, this.config, options.transformer) as Promise<T>;
    }

    return result;
  }

  async requestRaw(
    method: HttpMethod,
    path: string,
    options: RequestOptions = {}
  ): Promise<unknown> {
    const endpoint = this.buildUrl(path, options.params);
    return withRetry(
      () => this.executeRequest<unknown>(method, endpoint, options),
      this.config.retries,
      () => endpoint
    );
  }

  private async executeRequest<T>(
    method: HttpMethod,
    endpoint: string,
    options: RequestOptions
  ): Promise<T> {
    const release = await this.rateLimiter.acquire();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const headers: Record<string, string> = {
        Accept: 'application/json',
        ...options.headers,
      };

      if (options.body !== undefined) {
        headers['Content-Type'] = 'application/json';
      }

      if (this.config.useBearerAuth) {
        headers.Authorization = `Bearer ${this.config.apiKey}`;
      }

      const response = await this.config.fetch(endpoint, {
        method,
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = await response.text();
      const body = text ? safeJsonParse(text) : undefined;
      const requestId =
        response.headers.get('x-request-id') ??
        response.headers.get('request-id') ??
        undefined;

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = parseRetryAfterHeader(response.headers.get('Retry-After'));
          const error = createPipelineCRMError(429, endpoint, body, requestId);
          if (retryAfter && 'retryAfter' in error) {
            (error as { retryAfter?: number }).retryAfter = retryAfter;
          }
          throw error;
        }
        throw createPipelineCRMError(response.status, endpoint, body, requestId);
      }

      return body as T;
    } catch (error) {
      if (error instanceof PipelineCRMError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new PipelineCRMError(`Request timed out after ${this.config.timeout}ms`, {
          status: 408,
          endpoint,
        });
      }
      throw new PipelineCRMError(
        error instanceof Error ? error.message : 'Network request failed',
        { status: 0, endpoint }
      );
    } finally {
      release();
    }
  }

  buildUrl(path: string, params?: Record<string, unknown>): string {
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    const base = this.config.baseUrl.replace(/\/$/, '');
    let url = `${base}/${normalizedPath}`;

    if (!this.config.useBearerAuth) {
      url = appendAuthToUrl(url, this.config.apiKey, this.config.appKey);
    }

    if (params && Object.keys(params).length > 0) {
      const parsed = new URL(url);
      for (const [key, value] of Object.entries(serializeParams(params))) {
        parsed.searchParams.set(key, value);
      }
      url = parsed.toString();
    }

    return url;
  }
}

function mapMethodToOperation(method: HttpMethod): TransformContext['operation'] {
  switch (method) {
    case 'GET':
      return 'list';
    case 'POST':
      return 'create';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return 'list';
  }
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
