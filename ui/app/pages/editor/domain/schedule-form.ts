export const FREQUENCIES = [
  "minutes",
  "hours",
  "day",
  "week",
  "month",
] as const;
export type Frequency = (typeof FREQUENCIES)[number];
export const WEEKDAYS = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
] as const;

export type ScheduleValue = Record<string, unknown> & { every?: Frequency };

const DEFAULTS: Record<Frequency, Record<string, unknown>> = {
  minutes: { interval: 15 },
  hours: { interval: 1, minute: 0 },
  day: { time: "09:00" },
  week: { weekdays: ["mon"], time: "09:00" },
  month: { day: 1, time: "09:00" },
};

/** Switching frequency keeps the time and time zone the person already chose. */
export function scheduleForFrequency(
  every: Frequency,
  previous: ScheduleValue | undefined,
): ScheduleValue {
  const defaults = DEFAULTS[every];
  const kept = Object.fromEntries(
    ["time", "timezone"]
      .filter((key) => key in defaults || key === "timezone")
      .filter((key) => previous?.[key] !== undefined)
      .map((key) => [key, previous![key]]),
  );
  return { every, ...defaults, ...kept };
}

/** Weekdays toggled in calendar order. */
export function toggleWeekday(weekdays: string[], day: string): string[] {
  const next = weekdays.includes(day)
    ? weekdays.filter((d) => d !== day)
    : [...weekdays, day];
  return WEEKDAYS.filter((d) => next.includes(d));
}

export const defaultTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";
