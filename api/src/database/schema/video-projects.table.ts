import { jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { SavedVideoProject } from '../../modules/videos/domain/saved-video-project.js';
import { relay } from './relay-schema.js';

/** Video projects: the setup plus the command history that builds the timeline. */
export const videoProjects = relay.table('video_projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  setup: jsonb('setup').$type<SavedVideoProject['setup']>().notNull(),
  history: jsonb('history').$type<SavedVideoProject['history']>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
