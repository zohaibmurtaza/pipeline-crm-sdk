import type { HttpClient } from '../../http/http-client.js';
import type { ResolvedConfig } from '../../types/config.js';
import { AdminResource, WebhooksAdminResource } from './admin-resource.js';

export class AdminNamespace {
  readonly dealStages: AdminResource;
  readonly dealLossReasons: AdminResource;
  readonly dealWonReasons: AdminResource;
  readonly noteCategories: AdminResource;
  readonly webhooks: WebhooksAdminResource;
  readonly productLines: AdminResource;
  readonly revenueTypes: AdminResource;
  readonly predefinedContactsTags: AdminResource;
  readonly personCustomFieldLabels: AdminResource;
  readonly personCustomFieldGroups: AdminResource;
  readonly dealCustomFieldGroups: AdminResource;
  readonly companyCustomFieldGroups: AdminResource;
  readonly todoTemplates: AdminResource;

  constructor(http: HttpClient, _config: ResolvedConfig) {
    this.dealStages = new AdminResource(http, 'admin/deal_stages');
    this.dealLossReasons = new AdminResource(http, 'admin/deal_loss_reasons');
    this.dealWonReasons = new AdminResource(http, 'admin/deal_won_reasons');
    this.noteCategories = new AdminResource(http, 'admin/note_categories');
    this.webhooks = new WebhooksAdminResource(http, 'admin/webhooks');
    this.productLines = new AdminResource(http, 'admin/product_lines');
    this.revenueTypes = new AdminResource(http, 'admin/revenue_types');
    this.predefinedContactsTags = new AdminResource(http, 'admin/predefined_contacts_tags');
    this.personCustomFieldLabels = new AdminResource(http, 'admin/person_custom_field_labels');
    this.personCustomFieldGroups = new AdminResource(http, 'admin/person_custom_field_groups');
    this.dealCustomFieldGroups = new AdminResource(http, 'admin/deal_custom_field_groups');
    this.companyCustomFieldGroups = new AdminResource(http, 'admin/company_custom_field_groups');
    this.todoTemplates = new AdminResource(http, 'admin/todo_templates');
  }
}
