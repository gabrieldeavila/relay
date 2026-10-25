import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DATABASE, type Database } from '../../../database/database.js';
import { videoExports } from '../../../database/schema/index.js';

export type VideoExportRow = typeof videoExports.$inferSelect;

@Injectable()
export class VideoExportsRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(projectId: string) {
    const [row] = await this.db
      .insert(videoExports)
      .values({ projectId })
      .returning();
    return row;
  }

  async find(id: string): Promise<VideoExportRow | null> {
    const [row] = await this.db
      .select()
      .from(videoExports)
      .where(eq(videoExports.id, id));
    return row ?? null;
  }

  async latestDone(projectId: string): Promise<VideoExportRow | null> {
    const [row] = await this.db
      .select()
      .from(videoExports)
      .where(
        and(
          eq(videoExports.projectId, projectId),
          eq(videoExports.status, 'done'),
        ),
      )
      .orderBy(desc(videoExports.createdAt))
      .limit(1);
    return row ?? null;
  }

  async progress(id: string, progress: number) {
    await this.db
      .update(videoExports)
      .set({ progress })
      .where(eq(videoExports.id, id));
  }

  async finish(id: string, result: { assetId: string } | { error: string }) {
    const done = 'assetId' in result;
    await this.db
      .update(videoExports)
      .set({
        status: done ? 'done' : 'failed',
        progress: done ? 1 : undefined,
        assetId: done ? result.assetId : null,
        error: done ? null : result.error,
        finishedAt: new Date(),
      })
      .where(eq(videoExports.id, id));
  }
}
