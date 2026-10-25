import {
  bigint,
  boolean,
  index,
  integer,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import type {
  AssetKind,
  AssetSource,
} from '../../modules/assets/domain/asset.js';
import { relay } from './relay-schema.js';

export const assets = relay.table(
  'assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    kind: text('kind').$type<AssetKind>().notNull(),
    name: text('name').notNull(),
    mimeType: text('mime_type').notNull(),
    bytes: bigint('bytes', { mode: 'number' }).notNull(),
    width: integer('width'),
    height: integer('height'),
    durationMs: integer('duration_ms'),
    hasAudio: boolean('has_audio').notNull().default(false),
    source: text('source').$type<AssetSource>().notNull(),
    /** Absolute path of the file under ASSETS_DIR. */
    path: text('path').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index().on(table.kind, table.createdAt)],
);
