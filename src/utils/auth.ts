export function buildAuthParams(apiKey: string, appKey: string): Record<string, string> {
  return {
    api_key: apiKey,
    app_key: appKey,
  };
}

export function appendAuthToUrl(
  url: string,
  apiKey: string,
  appKey: string
): string {
  const parsed = new URL(url);
  parsed.searchParams.set('api_key', apiKey);
  parsed.searchParams.set('app_key', appKey);
  return parsed.toString();
}

export function serializeParams(params?: Record<string, unknown>): Record<string, string> {
  if (!params) return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'object') {
      result[key] = JSON.stringify(value);
    } else {
      result[key] = String(value);
    }
  }
  return result;
}
