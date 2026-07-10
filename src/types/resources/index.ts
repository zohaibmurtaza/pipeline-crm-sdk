export interface CustomFields {
  [key: string]: unknown;
}

export interface Owner {
  id: number;
  full_name?: string;
  first_name?: string;
  last_name?: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Company {
  id: number;
  name: string;
  description?: string;
  email?: string;
  web?: string;
  phone1?: string;
  phone2?: string;
  phone3?: string;
  phone4?: string;
  fax?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postal_code?: string | number;
  country?: string;
  owner_id?: number;
  owner?: Owner;
  shared_user_ids?: number[];
  tag_ids?: number[];
  tags?: Tag[];
  custom_fields?: CustomFields;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface DealStage {
  id: number;
  name: string;
  percent?: number;
  deal_pipeline_id?: number;
}

export interface Deal {
  id: number;
  name: string;
  summary?: string;
  value?: number;
  status?: number;
  probability?: number;
  user_id?: number;
  owner?: Owner;
  company_id?: number;
  company_name?: string;
  company?: { id: number; name: string };
  deal_stage_id?: number;
  deal_stage?: DealStage;
  deal_loss_reason_id?: number;
  deal_won_reason_id?: number;
  primary_contact_id?: number;
  primary_contact?: Owner;
  person_ids?: number[];
  people?: unknown[];
  shared_user_ids?: number[];
  tag_ids?: number[];
  tags?: Tag[];
  custom_fields?: CustomFields;
  expected_close_date?: string;
  closed_time?: string;
  is_archived?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface Person {
  id: number;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  company_id?: number;
  owner_id?: number;
  owner?: Owner;
  tag_ids?: number[];
  tags?: Tag[];
  custom_fields?: CustomFields;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface Lead {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  company_name?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface Note {
  id: number;
  title?: string;
  content?: string;
  user_id?: number;
  deal_id?: number;
  company_id?: number;
  person_id?: number;
  note_category_id?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface Activity {
  id: number;
  title?: string;
  content?: string;
  user_id?: number;
  deal_id?: number;
  company_id?: number;
  person_id?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface CalendarEntry {
  id: number;
  name?: string;
  description?: string;
  type?: string;
  start_time?: string;
  end_time?: string;
  due_date?: string;
  complete?: boolean;
  owner_id?: number;
  company_id?: number;
  association_id?: number;
  association_type?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface Document {
  id: number;
  name?: string;
  public_link?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface Comment {
  id: number;
  content?: string;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface User {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  is_account_admin?: boolean;
  [key: string]: unknown;
}

export interface Account {
  id: number;
  name?: string;
  [key: string]: unknown;
}

export interface ObjectType {
  id?: number;
  name?: string;
  api_handle?: string;
  [key: string]: unknown;
}

export interface Search {
  id: number;
  name: string;
  search_type?: string;
  query?: Record<string, unknown>;
  sort?: string;
  columns?: string[];
  [key: string]: unknown;
}

export interface Webhook {
  id: number;
  name?: string;
  event_model?: string;
  event_action?: string;
  url?: string;
  is_activated?: boolean;
  [key: string]: unknown;
}

export interface AdminEntry {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}
