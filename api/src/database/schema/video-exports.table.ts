import { index, real, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { ExportStatus } from '../../modules/videos/domain/export-status.js';
import { assets } from './assets.table.js';
import { relay } from './relay-schema.js';
import { videoProjects } from './video-projects.table.js';

/** One render of a video project to an mp4, which becomes an asset when done. */
export const videoExports = relay.table(
  'video_exports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => videoProjects.id, { onDelete: 'cascade' }),
    status: text('status').$type<ExportStatus>().notNull().default('running'),
    /** 0..1 */
    progress: real('progress').notNull().default(0),
    assetId: uuid('asset_id').references(() => assets.id, {
      onDelete: 'set null',
    }),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
  },
  (table) => [index().on(table.projectId, table.createdAt)],
);
