import { z } from 'zod';
import { DURATION_UNITS, toMilliseconds } from '../domain/duration.js';
import { defineNode } from '../domain/node-definition.js';
import { done, sleepUntil } from '../domain/node-result.js';

/** Parks the step in the database; no worker is held while it waits. */
export const delayNode = defineNode({
  type: 'flow.delay',
  kind: 'action',
  title: 'Wait',
  description: 'Waits for a while before going on.',
  config: z.object({
    amount: z.coerce.number().positive(),
    unit: z.enum(DURATION_UNITS).default('minutes'),
  }),
  outputPorts: ['out'],
  run({ amount, unit }, ctx) {
    const now = ctx.now();
    if (ctx.resumed) return Promise.resolve(done({ resumedAt: now }));
    const until = new Date(now.getTime() + toMilliseconds(amount, unit));
    return Promise.resolve(sleepUntil(until));
  },
});
