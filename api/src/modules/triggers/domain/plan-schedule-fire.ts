import { nextFireAfter } from './next-fire-time.js';
import type { Schedule } from './schedule.js';

export interface ScheduleFire {
  payload: { scheduledFor: string; firedAt: string; late: boolean };
  nextFireAt: Date;
}

/** Fires later than this count as caught up after the machine was off. */
const LATE_AFTER_MS = 60_000;

/**
 * One fire for a due schedule. Fires missed while the machine was off are not
 * replayed one by one: this single fire catches up, and the next one is the
 * first future slot.
 */
export function planScheduleFire(
  schedule: Schedule,
  scheduledFor: Date,
  now: Date,
): ScheduleFire {
  return {
    payload: {
      scheduledFor: scheduledFor.toISOString(),
      firedAt: now.toISOString(),
      late: now.getTime() - scheduledFor.getTime() > LATE_AFTER_MS,
    },
    nextFireAt: nextFireAfter(schedule, now),
  };
}
