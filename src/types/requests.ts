import type { HttpMethod } from './config.js';
import type { ListParams, SearchParams } from './pagination.js';

export interface RequestOptions {
  params?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
  transformer?: import('./config.js').Transformer;
  operation?: import('./config.js').TransformOperation;
  page?: number;
}

export interface HttpRequest {
  method: HttpMethod;
  path: string;
  options?: RequestOptions;
}

export type CreateOptions = {
  check_for_duplicates?: boolean;
  deliver_assignment_email?: boolean;
  todo_template_id?: number;
  todo_template_user_id?: number;
  [key: string]: unknown;
};

export type UpdateOptions = {
  deliver_reassignment_email?: boolean;
  [key: string]: unknown;
};

export interface MergeOptions {
  [key: string]: unknown;
}

export type ResourceListParams = ListParams;
export type ResourceSearchParams = SearchParams;
