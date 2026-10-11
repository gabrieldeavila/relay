import type { Schedule } from './schedule.js';

export const SCHEDULE_TRIGGER = 'trigger.schedule';
export const WEBHOOK_TRIGGER = 'trigger.webhook';

/** How a published workflow starts without someone pressing Run. */
export type TriggerRegistration =
  { kind: 'schedule'; schedule: Schedule } | { kind: 'webhook' };

export interface TriggerRegistry {
  /** Null removes the workflow's trigger (it went back to manual). */
  register(
    workflowId: string,
    registration: TriggerRegistration | null,
  ): Promise<void>;
}
