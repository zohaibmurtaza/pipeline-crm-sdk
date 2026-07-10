export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RetryConfig {
  max?: number;
  delay?: number;
  backoff?: number;
  retryOn?: number[];
}

export interface RateLimitConfig {
  maxConcurrent?: number;
  maxPerSecond?: number;
}

export interface PipelineCRMConfig {
  apiKey: string;
  appKey: string;
  baseUrl?: string;
  timeout?: number;
  retries?: RetryConfig;
  rateLimit?: RateLimitConfig;
  transformer?: Transformer;
  useBearerAuth?: boolean;
  fetch?: typeof fetch;
}

export type TransformOperation =
  | 'list'
  | 'get'
  | 'create'
  | 'update'
  | 'delete'
  | 'search'
  | 'merge';

export interface TransformContext {
  resource: string;
  operation: TransformOperation;
  page?: number;
}

export type Transformer<TIn = unknown, TOut = unknown> = (
  data: TIn,
  ctx: TransformContext
) => TOut | Promise<TOut>;

export interface ResolvedConfig {
  apiKey: string;
  appKey: string;
  baseUrl: string;
  timeout: number;
  retries: Required<RetryConfig>;
  rateLimit: Required<RateLimitConfig>;
  transformer?: Transformer;
  useBearerAuth: boolean;
  fetch: typeof fetch;
}

export const DEFAULT_BASE_URL = 'https://api.pipelinecrm.com/api/v3';
export const DEFAULT_TIMEOUT = 30_000;
export const DEFAULT_RETRIES: Required<RetryConfig> = {
  max: 3,
  delay: 500,
  backoff: 2,
  retryOn: [408, 429, 500, 502, 503, 504],
};
export const DEFAULT_RATE_LIMIT: Required<RateLimitConfig> = {
  maxConcurrent: 5,
  maxPerSecond: 10,
};

export function resolveConfig(config: PipelineCRMConfig): ResolvedConfig {
  return {
    apiKey: config.apiKey,
    appKey: config.appKey,
    baseUrl: config.baseUrl ?? DEFAULT_BASE_URL,
    timeout: config.timeout ?? DEFAULT_TIMEOUT,
    retries: { ...DEFAULT_RETRIES, ...config.retries },
    rateLimit: { ...DEFAULT_RATE_LIMIT, ...config.rateLimit },
    transformer: config.transformer,
    useBearerAuth: config.useBearerAuth ?? false,
    fetch: config.fetch ?? globalThis.fetch,
  };
}
