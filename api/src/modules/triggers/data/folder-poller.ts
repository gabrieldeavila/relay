import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import {
  DATABASE,
  type Database,
  type Transaction,
} from '../../../database/database.js';
import { seenFiles, triggers } from '../../../database/schema/index.js';
import { RunStarter } from '../../engine/data/run-starter.js';
import type { FolderWatch } from '../domain/folder-watch.js';
import { pickNewFiles, type ListedFile } from '../domain/pick-new-files.js';
import { folderPath, listFolder } from './list-folder.js';

const POLL_MS = 3_000;
/** Runs started per folder per round; the rest wait for the next round. */
const FILES_PER_ROUND = 20;

/**
 * Starts a run for each new file in watched folders. Polling (instead of file
 * system events) keeps working across restarts, sleep and network drives,
 * and catches files that arrived while Relay was off.
 */
@Injectable()
export class FolderPoller
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(FolderPoller.name);
  private timer?: NodeJS.Timeout;

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly starter: RunStarter,
  ) {}

  onApplicationBootstrap() {
    if (process.env.WORKER_ENABLED === 'false') return;
    this.timer = setInterval(() => void this.tick(), POLL_MS);
  }

  onApplicationShutdown() {
    clearInterval(this.timer);
  }

  /**
   * Claims folder triggers with SKIP LOCKED and records each file in the same
   * transaction that starts its run, so a file never starts two runs.
   */
  scan(now = new Date()): Promise<number> {
    return this.db.transaction(async (tx) => {
      const watched = await tx
        .select({ workflowId: triggers.workflowId, watch: triggers.watch })
        .from(triggers)
        .where(and(eq(triggers.kind, 'folder'), eq(triggers.enabled, true)))
        .for('update', { skipLocked: true });

      let started = 0;
      for (const { workflowId, watch } of watched) {
        if (watch) started += await this.scanOne(tx, workflowId, watch, now);
      }
      return started;
    });
  }

  private async scanOne(
    tx: Transaction,
    workflowId: string,
    watch: FolderWatch,
    now: Date,
  ): Promise<number> {
    const folder = folderPath(watch.folder);
    const listing = await listFolder(folder);
    if (!listing) return 0;
    const seen = await tx
      .select({ name: seenFiles.name, modifiedMs: seenFiles.modifiedMs })
      .from(seenFiles)
      .where(eq(seenFiles.workflowId, workflowId));
    const fresh = pickNewFiles(
      listing,
      new Map(seen.map((file) => [file.name, file.modifiedMs])),
      { pattern: watch.pattern, now, limit: FILES_PER_ROUND },
    );
    for (const file of fresh) {
      await markSeen(tx, workflowId, file);
      await this.starter.startRunIn(tx, workflowId, payloadOf(folder, file));
    }
    return fresh.length;
  }

  private async tick() {
    try {
      await this.scan();
    } catch (error) {
      this.logger.error('Folder scan failed', error);
    }
  }
}

function markSeen(tx: Transaction, workflowId: string, file: ListedFile) {
  return tx
    .insert(seenFiles)
    .values({ workflowId, name: file.name, modifiedMs: file.modifiedMs })
    .onConflictDoUpdate({
      target: [seenFiles.workflowId, seenFiles.name],
      set: { modifiedMs: sql`excluded.modified_ms` },
    });
}

/** The trigger's output: what later steps use, e.g. `{{ trigger.path }}`. */
function payloadOf(folder: string, file: ListedFile) {
  return {
    name: file.name,
    path: `${folder.replace(/\/+$/, '')}/${file.name}`,
    folder,
    bytes: file.bytes,
    modifiedAt: new Date(file.modifiedMs).toISOString(),
  };
}
