import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../../../database/database.js';
import { isUuid } from '../../../is-uuid.js';
import { AssetStore } from '../../assets/data/asset-store.js';
import type { Timeline } from '../domain/timeline-types.js';
import { VideoExportsRepository } from './video-exports.repository.js';
import { VideoRenderer } from './video-renderer.js';

/** Progress is written at most this often. */
const PROGRESS_EVERY_MS = 1000;

/** Renders projects to mp4 in the background; each finished export is an asset. */
@Injectable()
export class VideoExports implements OnModuleInit {
  private readonly logger = new Logger(VideoExports.name);

  constructor(
    private readonly repository: VideoExportsRepository,
    private readonly renderer: VideoRenderer,
    private readonly assets: AssetStore,
    @Inject(DATABASE) private readonly db: Database,
  ) {}

  /** Exports cut short by a restart will never finish. */
  async onModuleInit() {
    await this.db.execute(
      sql`UPDATE relay.video_exports SET status = 'failed', error = 'Relay restarted during the export', finished_at = now() WHERE status = 'running'`,
    );
  }

  /** Starts rendering and returns right away with the export's id. */
  async start(projectId: string, name: string, timeline: Timeline) {
    const problems = await this.renderer.problems(timeline);
    if (problems.length > 0) throw new Error(problems.join('\n'));
    const row = await this.repository.create(projectId);
    void this.render(row.id, name, timeline);
    return row;
  }

  async get(id: string) {
    const row = isUuid(id) ? await this.repository.find(id) : null;
    if (!row) throw new Error(`No export with id ${id}`);
    return row;
  }

  latestDone(projectId: string) {
    return this.repository.latestDone(projectId);
  }

  private async render(exportId: string, name: string, timeline: Timeline) {
    const file = await this.assets.reserve('mp4');
    let lastWrite = 0;
    const onProgress = (progress: number) => {
      if (Date.now() - lastWrite < PROGRESS_EVERY_MS) return;
      lastWrite = Date.now();
      void this.repository.progress(exportId, progress);
    };
    try {
      await this.renderer.toFile(timeline, file.path, onProgress);
      const asset = await this.assets.register(file, `${name}.mp4`, 'export');
      await this.repository.finish(exportId, { assetId: asset.id });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Export ${exportId} failed: ${message}`);
      await this.repository.finish(exportId, { error: message });
    }
  }
}
