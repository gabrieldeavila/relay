import { z } from 'zod';
import { DURATION_UNITS, toMilliseconds } from './duration.js';

/** Optional "give up after" fields shared by nodes that wait for an answer. */
export const waitTimeoutFields = {
  timeoutAmount: z.coerce.number().positive().optional(),
  timeoutUnit: z.enum(DURATION_UNITS).default('days'),
};

export function waitDeadline(
  now: Date,
  {
    timeoutAmount,
    timeoutUnit,
  }: { timeoutAmount?: number; timeoutUnit: (typeof DURATION_UNITS)[number] },
): Date | undefined {
  if (timeoutAmount === undefined) return undefined;
  return new Date(now.getTime() + toMilliseconds(timeoutAmount, timeoutUnit));
}
