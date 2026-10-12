import type { AccountKind } from '../../accounts/domain/account-kinds.js';
import {
  appsUsed,
  matchApp,
  type ConnectedApp,
} from './instantiate-template.js';
import type { WorkflowTemplate } from './workflow-template.js';

export type TemplateNeed =
  | { kind: 'app'; key: string; name: string; ready: boolean }
  | { kind: 'account'; key: AccountKind; ready: boolean };

export interface TemplateSummary {
  id: string;
  title: string;
  description: string;
  needs: TemplateNeed[];
  /** Missing apps block it; missing accounts only fail the step later. */
  canUse: boolean;
}

/** A template as the user sees it: what it needs and what is already set up. */
export function describeTemplate(
  template: WorkflowTemplate,
  connected: ConnectedApp[],
  accounts: AccountKind[],
): TemplateSummary {
  const apps: TemplateNeed[] = appsUsed(template).map(({ app, tools }) => ({
    kind: 'app',
    key: app.key,
    name: app.name,
    ready: matchApp(app, tools, connected) !== undefined,
  }));
  const accountNeeds: TemplateNeed[] = template.accounts.map((key) => ({
    kind: 'account',
    key,
    ready: accounts.includes(key),
  }));
  return {
    id: template.id,
    title: template.title,
    description: template.description,
    needs: [...apps, ...accountNeeds],
    canUse: apps.every((need) => need.ready),
  };
}
