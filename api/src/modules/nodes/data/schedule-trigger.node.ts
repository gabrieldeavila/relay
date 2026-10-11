import { z } from 'zod';
import { scheduleSchema } from '../../triggers/domain/schedule.js';
import { SCHEDULE_TRIGGER } from '../../triggers/domain/trigger-registration.js';
import { defineNode } from '../domain/node-definition.js';
import { done } from '../domain/node-result.js';

/** Output: `{ scheduledFor, firedAt, late }`. */
export const scheduleTriggerNode = defineNode({
  type: SCHEDULE_TRIGGER,
  kind: 'trigger',
  title: 'On a schedule',
  description: 'Runs by itself every few minutes, daily, weekly or monthly.',
  config: z.object({ schedule: scheduleSchema }),
  outputPorts: ['out'],
  run: () => Promise.resolve(done(null)),
});
