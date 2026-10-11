import { Cron } from 'croner';
import type { Schedule } from './schedule.js';
import { scheduleToCron } from './schedule-to-cron.js';

/** First moment strictly after `after` when the schedule fires. */
export function nextFireAfter(schedule: Schedule, after: Date): Date {
  const cron = new Cron(scheduleToCron(schedule), {
    timezone: schedule.timezone,
    paused: true,
  });
  const next = cron.nextRun(after);
  if (!next) throw new Error('Schedule never fires again');
  return next;
}
