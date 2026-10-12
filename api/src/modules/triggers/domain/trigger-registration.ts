import type { FolderWatch } from './folder-watch.js';
import type { Schedule } from './schedule.js';

export const SCHEDULE_TRIGGER = 'trigger.schedule';
export const WEBHOOK_TRIGGER = 'trigger.webhook';
export const FOLDER_TRIGGER = 'trigger.folder';

/** How a published workflow starts without someone pressing Run. */
export type TriggerRegistration =
  | { kind: 'schedule'; schedule: Schedule }
  | { kind: 'webhook' }
  | { kind: 'folder'; watch: FolderWatch };

export interface TriggerRegistry {
  /** Null removes the workflow's trigger (it went back to manual). */
  register(
    workflowId: string,
    registration: TriggerRegistration | null,
  ): Promise<void>;
}
