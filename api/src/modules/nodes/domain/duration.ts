export const DURATION_UNITS = ['seconds', 'minutes', 'hours', 'days'] as const;
export type DurationUnit = (typeof DURATION_UNITS)[number];

const UNIT_MS: Record<DurationUnit, number> = {
  seconds: 1_000,
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
};

export const toMilliseconds = (amount: number, unit: DurationUnit) =>
  amount * UNIT_MS[unit];
