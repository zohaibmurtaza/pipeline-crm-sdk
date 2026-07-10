import type { RetryConfig } from '../types/config.js';
import { DEFAULT_RETRIES } from '../types/config.js';
import { PipelineCRMRateLimitError } from './errors.js';
import { parseRetryAfterHeader } from './errors.js';

type ResolvedRetry = Required<RetryConfig>;

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: ResolvedRetry,
  _getEndpoint: () => string
): Promise<T> {
  let lastError: unknown;
  const maxAttempts = config.max + 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryable(error, config.retryOn) || attempt >= config.max) {
        throw error;
      }

      const delay = getRetryDelay(error, config, attempt);
      await sleep(delay);
    }
  }

  throw lastError;
}

function isRetryable(error: unknown, retryOn: number[]): boolean {
  if (error instanceof PipelineCRMRateLimitError) return true;
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    return retryOn.includes(status);
  }
  if (error instanceof TypeError) return true;
  if (error instanceof Error && error.name === 'AbortError') return true;
  return false;
}

function getRetryDelay(error: unknown, config: ResolvedRetry, attempt: number): number {
  if (error instanceof PipelineCRMRateLimitError && error.retryAfter) {
    return error.retryAfter;
  }

  if (error && typeof error === 'object' && 'retryAfter' in error) {
    const retryAfter = (error as { retryAfter?: number }).retryAfter;
    if (retryAfter) return retryAfter;
  }

  return config.delay * Math.pow(config.backoff, attempt);
}

export function createRetryConfig(config?: RetryConfig): ResolvedRetry {
  return { ...DEFAULT_RETRIES, ...config };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { parseRetryAfterHeader };
