import {
  boolean,
  index,
  jsonb,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import type { FolderWatch } from '../../modules/triggers/domain/folder-watch.js';
import type { Schedule } from '../../modules/triggers/domain/schedule.js';
import { relay } from './relay-schema.js';
import { workflows } from './workflows.table.js';

export type TriggerKind = 'schedule' | 'webhook' | 'folder';

/** How a published workflow starts by itself; one per workflow. */
export const triggers = relay.table(
  'triggers',
  {
    workflowId: uuid('workflow_id')
      .primaryKey()
      .references(() => workflows.id, { onDelete: 'cascade' }),
    kind: text('kind').$type<TriggerKind>().notNull(),
    enabled: boolean('enabled').notNull().default(true),
    /** Webhook secret in `/hooks/:token`; kept across publishes. */
    token: text('token').notNull().unique(),
    schedule: jsonb('schedule').$type<Schedule>(),
    /** Folder and file pattern of a folder trigger. */
    watch: jsonb('watch').$type<FolderWatch>(),
    /** Claimed with SKIP LOCKED, so a fire never happens twice. */
    nextFireAt: timestamp('next_fire_at', { withTimezone: true }),
    lastFiredAt: timestamp('last_fired_at', { withTimezone: true }),
  },
  (table) => [index().on(table.kind, table.nextFireAt)],
);
