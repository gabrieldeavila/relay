import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  DATABASE,
  type Database,
  type Transaction,
} from '../../../database/database.js';
import { seenFiles, triggers } from '../../../database/schema/index.js';
import { newSecretToken } from '../../../security/new-secret-token.js';
import type { FolderWatch } from '../domain/folder-watch.js';
import { nextFireAfter } from '../domain/next-fire-time.js';
import type {
  TriggerRegistration,
  TriggerRegistry,
} from '../domain/trigger-registration.js';
import { folderPath, listFolder } from './list-folder.js';

@Injectable()
export class DrizzleTriggerRegistry implements TriggerRegistry {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /** Upserts the trigger; the webhook token survives republishing. */
  async register(workflowId: string, registration: TriggerRegistration | null) {
    if (!registration) {
      await this.db.delete(triggers).where(eq(triggers.workflowId, workflowId));
      return;
    }
    const schedule =
      registration.kind === 'schedule' ? registration.schedule : null;
    const watch = registration.kind === 'folder' ? registration.watch : null;
    const columns = {
      kind: registration.kind,
      enabled: true,
      schedule,
      watch,
      nextFireAt: schedule ? nextFireAfter(schedule, new Date()) : null,
    };
    await this.db.transaction(async (tx) => {
      const [previous] = await tx
        .select({ watch: triggers.watch })
        .from(triggers)
        .where(eq(triggers.workflowId, workflowId))
        .for('update');
      await tx
        .insert(triggers)
        .values({ workflowId, token: newSecretToken(), ...columns })
        .onConflictDoUpdate({ target: triggers.workflowId, set: columns });
      if (watch) await primeFolder(tx, workflowId, watch, previous?.watch);
    });
  }
}

/**
 * Marks the files already in the folder as seen, so publishing does not run
 * the flow for everything that was there before. Another folder or pattern
 * starts from scratch.
 */
async function primeFolder(
  tx: Transaction,
  workflowId: string,
  watch: FolderWatch,
  previous: FolderWatch | null | undefined,
) {
  const changed =
    previous?.folder !== watch.folder || previous?.pattern !== watch.pattern;
  if (changed) {
    await tx.delete(seenFiles).where(eq(seenFiles.workflowId, workflowId));
  }
  const files = await listFolder(folderPath(watch.folder));
  if (!files?.length) return;
  await tx
    .insert(seenFiles)
    .values(
      files.map(({ name, modifiedMs }) => ({ workflowId, name, modifiedMs })),
    )
    .onConflictDoNothing();
}
