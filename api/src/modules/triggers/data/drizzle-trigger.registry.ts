import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE, type Database } from '../../../database/database.js';
import { triggers } from '../../../database/schema/index.js';
import { newSecretToken } from '../../../security/new-secret-token.js';
import { nextFireAfter } from '../domain/next-fire-time.js';
import type {
  TriggerRegistration,
  TriggerRegistry,
} from '../domain/trigger-registration.js';

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
    const columns = {
      kind: registration.kind,
      enabled: true,
      schedule,
      nextFireAt: schedule ? nextFireAfter(schedule, new Date()) : null,
    };
    await this.db
      .insert(triggers)
      .values({ workflowId, token: newSecretToken(), ...columns })
      .onConflictDoUpdate({ target: triggers.workflowId, set: columns });
  }
}
