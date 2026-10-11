import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DATABASE, type Database } from '../../../database/database.js';
import { triggers } from '../../../database/schema/index.js';

@Injectable()
export class TriggerReader {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async forWorkflow(workflowId: string) {
    const [trigger] = await this.db
      .select()
      .from(triggers)
      .where(eq(triggers.workflowId, workflowId));
    return trigger ?? null;
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
