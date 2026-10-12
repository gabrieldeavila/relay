import { planTrigger } from '../../triggers/domain/plan-trigger.js';
import type { TriggerRegistry } from '../../triggers/domain/trigger-registration.js';
import type { GraphIssue } from './graph-issue.js';
import type { FindNodeSpec } from './node-spec.js';
import { validateGraph } from './validate-graph.js';
import type { WorkflowRepository } from './workflow.js';

export type PublishResult =
  | { type: 'published'; version: number }
  | { type: 'invalid'; issues: GraphIssue[] }
  | { type: 'not_found' };

/** Freezes the current draft as a new version, if it can run, and arms its trigger. */
export class PublishWorkflow {
  constructor(
    private readonly repository: WorkflowRepository,
    /** Built-in node types plus the tools of the owner's connected apps. */
    private readonly specsFor: (ownerId: string) => Promise<FindNodeSpec>,
    private readonly triggers: TriggerRegistry,
  ) {}

  async execute(workflowId: string, ownerId: string): Promise<PublishResult> {
    const workflow = await this.repository.find(workflowId, ownerId);
    if (!workflow) return { type: 'not_found' };

    const findSpec = await this.specsFor(ownerId);
    const issues = validateGraph(workflow.draftGraph, findSpec);
    if (issues.length) return { type: 'invalid', issues };
    const trigger = planTrigger(workflow.draftGraph, findSpec);
    if ('issue' in trigger) return { type: 'invalid', issues: [trigger.issue] };

    const version = await this.repository.addVersion(
      workflowId,
      workflow.draftGraph,
    );
    await this.triggers.register(workflowId, trigger.registration);
    return { type: 'published', version };
  }
}
