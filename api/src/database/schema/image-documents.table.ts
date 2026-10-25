import { jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { SavedImageDocument } from '../../modules/images/data/saved-image-document.js';
import { relay } from './relay-schema.js';

/** Image documents: the setup plus the command history that builds the pixels. */
export const imageDocuments = relay.table('image_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  setup: jsonb('setup').$type<SavedImageDocument['setup']>().notNull(),
  history: jsonb('history').$type<SavedImageDocument['history']>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
