import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DATABASE, type Database } from '../../../database/database.js';
import { triggers, workflows } from '../../../database/schema/index.js';

@Injectable()
export class TriggerReader {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /** Null both for a manual start and for someone else's workflow. */
  async forWorkflow(workflowId: string, ownerId: string) {
    const [row] = await this.db
      .select({ trigger: triggers })
      .from(triggers)
      .innerJoin(workflows, eq(workflows.id, triggers.workflowId))
      .where(
        and(
          eq(triggers.workflowId, workflowId),
          eq(workflows.ownerId, ownerId),
        ),
      );
    return row?.trigger ?? null;
  }

  /** The enabled webhook trigger behind a secret token. */
  async webhookByToken(token: string) {
    const [trigger] = await this.db
      .select({ workflowId: triggers.workflowId })
      .from(triggers)
      .where(
        and(
          eq(triggers.token, token),
          eq(triggers.kind, 'webhook'),
          eq(triggers.enabled, true),
        ),
      );
    return trigger ?? null;
  }
}
