import type { BulkOptions } from '../types/pagination.js';

export interface BulkFetchTarget<T = unknown> {
  listAll(options?: BulkOptions<T>): Promise<T[]>;
}

export class BulkHelper {
  async fetch<T>(resource: BulkFetchTarget<T>, options?: BulkOptions<T>): Promise<T[]> {
    return resource.listAll(options);
  }

  async fetchMany<T extends Record<string, BulkFetchTarget>>(
    resources: T,
    options?: BulkOptions
  ): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]['listAll']>> }> {
    const entries = await Promise.all(
      Object.entries(resources).map(async ([key, resource]) => {
        const data = await resource.listAll(options);
        return [key, data] as const;
      })
    );
    return Object.fromEntries(entries) as { [K in keyof T]: Awaited<ReturnType<T[K]['listAll']>> };
  }
}
