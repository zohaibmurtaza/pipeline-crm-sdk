export class PipelineCRMError extends Error {
  readonly status: number;
  readonly endpoint: string;
  readonly body: unknown;
  readonly requestId?: string;

  constructor(
    message: string,
    options: {
      status: number;
      endpoint: string;
      body?: unknown;
      requestId?: string;
    }
  ) {
    super(message);
    this.name = 'PipelineCRMError';
    this.status = options.status;
    this.endpoint = options.endpoint;
    this.body = options.body;
    this.requestId = options.requestId;
  }
}

export class PipelineCRMAuthError extends PipelineCRMError {
  constructor(endpoint: string, body?: unknown, requestId?: string) {
    super('Authentication failed. Check your API key and App key.', {
      status: 401,
      endpoint,
      body,
      requestId,
    });
    this.name = 'PipelineCRMAuthError';
  }
}

export class PipelineCRMRateLimitError extends PipelineCRMError {
  readonly retryAfter?: number;

  constructor(endpoint: string, retryAfter?: number, body?: unknown, requestId?: string) {
    super('Rate limit exceeded. Retry after the specified delay.', {
      status: 429,
      endpoint,
      body,
      requestId,
    });
    this.name = 'PipelineCRMRateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class PipelineCRMValidationError extends PipelineCRMError {
  constructor(endpoint: string, body?: unknown, requestId?: string) {
    super('Validation failed. Check request payload and required fields.', {
      status: 422,
      endpoint,
      body,
      requestId,
    });
    this.name = 'PipelineCRMValidationError';
  }
}

export class PipelineCRMNotFoundError extends PipelineCRMError {
  constructor(endpoint: string, body?: unknown, requestId?: string) {
    super('Resource not found.', {
      status: 404,
      endpoint,
      body,
      requestId,
    });
    this.name = 'PipelineCRMNotFoundError';
  }
}

export function createPipelineCRMError(
  status: number,
  endpoint: string,
  body?: unknown,
  requestId?: string
): PipelineCRMError {
  switch (status) {
    case 401:
    case 403:
      return new PipelineCRMAuthError(endpoint, body, requestId);
    case 404:
      return new PipelineCRMNotFoundError(endpoint, body, requestId);
    case 422:
      return new PipelineCRMValidationError(endpoint, body, requestId);
    case 429: {
      const retryAfter = parseRetryAfter(body);
      return new PipelineCRMRateLimitError(endpoint, retryAfter, body, requestId);
    }
    default:
      return new PipelineCRMError(`Request failed with status ${status}`, {
        status,
        endpoint,
        body,
        requestId,
      });
  }
}

function parseRetryAfter(body: unknown): number | undefined {
  if (body && typeof body === 'object' && 'retry_after' in body) {
    const value = (body as { retry_after?: unknown }).retry_after;
    if (typeof value === 'number') return value;
  }
  return undefined;
}

export function parseRetryAfterHeader(header: string | null): number | undefined {
  if (!header) return undefined;
  const seconds = Number(header);
  if (!Number.isNaN(seconds)) return seconds * 1000;
  const date = Date.parse(header);
  if (!Number.isNaN(date)) return Math.max(0, date - Date.now());
  return undefined;
}
