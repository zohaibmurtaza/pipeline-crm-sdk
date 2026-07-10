export { PipelineCRM, default } from './client.js';

export {
  PipelineCRMError,
  PipelineCRMAuthError,
  PipelineCRMRateLimitError,
  PipelineCRMValidationError,
  PipelineCRMNotFoundError,
} from './http/errors.js';

export type {
  PipelineCRMConfig,
  RetryConfig,
  RateLimitConfig,
  Transformer,
  TransformContext,
  TransformOperation,
  HttpMethod,
} from './types/config.js';

export type {
  Pagination,
  PaginatedResponse,
  ListParams,
  SearchParams,
  BulkOptions,
  ListResult,
} from './types/pagination.js';

export type {
  RequestOptions,
  CreateOptions,
  UpdateOptions,
  MergeOptions,
} from './types/requests.js';

export type {
  Company,
  Deal,
  Person,
  Lead,
  Note,
  Activity,
  CalendarEntry,
  Document,
  Comment,
  User,
  Account,
  ObjectType,
  Search,
  Webhook,
  AdminEntry,
  CustomFields,
  Owner,
  Tag,
  DealStage,
} from './types/resources/index.js';

export { BaseResource } from './resources/base-resource.js';
export { ObjectResource } from './resources/object-resource.js';
export { ObjectsRegistry } from './resources/objects-registry.js';
