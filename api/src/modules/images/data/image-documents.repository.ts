import { Inject, Injectable } from '@nestjs/common';
import { desc, eq, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../../../database/database.js';
import { imageDocuments } from '../../../database/schema/index.js';
import type { SavedImageDocument } from './saved-image-document.js';

@Injectable()
export class ImageDocumentsRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(name: string, saved: SavedImageDocument) {
    const [row] = await this.db
      .insert(imageDocuments)
      .values({ name, ...saved })
      .returning();
    return row;
  }

  async find(id: string) {
    const [row] = await this.db
      .select()
      .from(imageDocuments)
      .where(eq(imageDocuments.id, id));
    return row ?? null;
  }

  /** Newest first, without the (large) history. */
  list() {
    return this.db
      .select({
        id: imageDocuments.id,
        name: imageDocuments.name,
        setup: imageDocuments.setup,
        edits: sql<number>`(${imageDocuments.history}->>'cursor')::int`,
        createdAt: imageDocuments.createdAt,
        updatedAt: imageDocuments.updatedAt,
      })
      .from(imageDocuments)
      .orderBy(desc(imageDocuments.updatedAt));
  }

  async save(id: string, saved: SavedImageDocument) {
    await this.db
      .update(imageDocuments)
      .set({ ...saved, updatedAt: new Date() })
      .where(eq(imageDocuments.id, id));
  }
}
