import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { and, eq, lte } from 'drizzle-orm';
import { DATABASE, type Database } from '../../../database/database.js';
import { triggers } from '../../../database/schema/index.js';
import { RunStarter } from '../../engine/data/run-starter.js';
import { planScheduleFire } from '../domain/plan-schedule-fire.js';

const POLL_MS = 5_000;

/** Starts runs for schedules that are due. */
@Injectable()
export class SchedulePoller
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(SchedulePoller.name);
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
   * Claims due schedules with SKIP LOCKED and starts their run in the same
   * transaction that moves `next_fire_at`, so a slot never fires twice.
   */
  fireDue(now = new Date(), limit = 10): Promise<number> {
    return this.db.transaction(async (tx) => {
      const due = await tx
        .select()
        .from(triggers)
        .where(
          and(
            eq(triggers.kind, 'schedule'),
            eq(triggers.enabled, true),
            lte(triggers.nextFireAt, now),
          ),
        )
        .limit(limit)
        .for('update', { skipLocked: true });

      for (const trigger of due) {
        if (!trigger.schedule || !trigger.nextFireAt) continue;
        const fire = planScheduleFire(
          trigger.schedule,
          trigger.nextFireAt,
          now,
        );
        await this.starter.startRunIn(tx, trigger.workflowId, fire.payload);
        await tx
          .update(triggers)
          .set({ nextFireAt: fire.nextFireAt, lastFiredAt: now })
          .where(eq(triggers.workflowId, trigger.workflowId));
      }
      return due.length;
    });
  }

  private async tick() {
    try {
      await this.fireDue();
    } catch (error) {
      this.logger.error('Schedule poll failed', error);
    }
  }
}
