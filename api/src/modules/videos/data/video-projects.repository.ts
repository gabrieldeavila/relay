import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { DATABASE, type Database } from '../../../database/database.js';
import { videoProjects } from '../../../database/schema/index.js';
import type { SavedVideoProject } from '../domain/saved-video-project.js';

@Injectable()
export class VideoProjectsRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(name: string, saved: SavedVideoProject) {
    const [row] = await this.db
      .insert(videoProjects)
      .values({ name, ...saved })
      .returning();
    return row;
  }

  async find(id: string) {
    const [row] = await this.db
      .select()
      .from(videoProjects)
      .where(eq(videoProjects.id, id));
    return row ?? null;
  }

  list() {
    return this.db
      .select()
      .from(videoProjects)
      .orderBy(desc(videoProjects.updatedAt));
  }

  async save(id: string, saved: SavedVideoProject) {
    await this.db
      .update(videoProjects)
      .set({ ...saved, updatedAt: new Date() })
      .where(eq(videoProjects.id, id));
  }
}
