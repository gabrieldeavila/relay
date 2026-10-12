import { findTrigger } from '../../workflows/domain/find-trigger.js';
import type { WorkflowGraph } from '../../workflows/domain/graph.js';
import type { GraphIssue } from '../../workflows/domain/graph-issue.js';
import type { FindNodeSpec } from '../../workflows/domain/node-spec.js';
import { folderWatchSchema } from './folder-watch.js';
import { scheduleSchema } from './schedule.js';
import {
  FOLDER_TRIGGER,
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
  switch (trigger?.type) {
    case WEBHOOK_TRIGGER:
      return { registration: { kind: 'webhook' } };
    case SCHEDULE_TRIGGER: {
      const parsed = scheduleSchema.safeParse(trigger.config.schedule);
      return parsed.success
        ? { registration: { kind: 'schedule', schedule: parsed.data } }
        : invalidConfig(trigger.id, 'schedule');
    }
    case FOLDER_TRIGGER: {
      const parsed = folderWatchSchema.safeParse(trigger.config);
      return parsed.success
        ? { registration: { kind: 'folder', watch: parsed.data } }
        : invalidConfig(trigger.id, 'folder');
    }
    default:
      return { registration: null };
  }
}

const invalidConfig = (nodeId: string, field: string): TriggerPlan => ({
  issue: { code: 'invalid_config', nodeId, field },
});
