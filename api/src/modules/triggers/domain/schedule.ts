import { z } from 'zod';

export const WEEKDAYS = [
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
] as const;
export type Weekday = (typeof WEEKDAYS)[number];

const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM, e.g. 09:00');

const timezone = z
  .string()
  .default('America/Sao_Paulo')
  .refine(isTimeZone, 'Unknown time zone');

/** "Every Monday at 09:00" in words a person picks from a form, not cron. */
export const scheduleSchema = z.discriminatedUnion('every', [
  z.object({
    every: z.literal('minutes'),
    interval: z.coerce.number().int().min(1).max(59),
    timezone,
  }),
  z.object({
    every: z.literal('hours'),
    interval: z.coerce.number().int().min(1).max(23).default(1),
    minute: z.coerce.number().int().min(0).max(59).default(0),
    timezone,
  }),
  z.object({ every: z.literal('day'), time, timezone }),
  z.object({
    every: z.literal('week'),
    weekdays: z.array(z.enum(WEEKDAYS)).min(1),
    time,
    timezone,
  }),
  z.object({
    every: z.literal('month'),
    day: z.coerce.number().int().min(1).max(28),
    time,
    timezone,
  }),
]);

export type Schedule = z.infer<typeof scheduleSchema>;

function isTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
