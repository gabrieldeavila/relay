import { findTrigger } from '../../workflows/domain/find-trigger.js';
import type { WorkflowGraph } from '../../workflows/domain/graph.js';
import type { GraphIssue } from '../../workflows/domain/graph-issue.js';
import type { FindNodeSpec } from '../../workflows/domain/node-spec.js';
import { scheduleSchema } from './schedule.js';
import {
  SCHEDULE_TRIGGER,
  WEBHOOK_TRIGGER,
  type TriggerRegistration,
} from './trigger-registration.js';

export type TriggerPlan =
  { registration: TriggerRegistration | null } | { issue: GraphIssue };

/** What to register for a valid graph's trigger node. */
export function planTrigger(
  graph: WorkflowGraph,
  findSpec: FindNodeSpec,
): TriggerPlan {
  const trigger = findTrigger(graph, findSpec);
  if (trigger?.type === WEBHOOK_TRIGGER) {
    return { registration: { kind: 'webhook' } };
  }
  if (trigger?.type !== SCHEDULE_TRIGGER) return { registration: null };

  const parsed = scheduleSchema.safeParse(trigger.config.schedule);
  if (!parsed.success) {
    return {
      issue: { code: 'invalid_config', nodeId: trigger.id, field: 'schedule' },
    };
  }
  return { registration: { kind: 'schedule', schedule: parsed.data } };
}
