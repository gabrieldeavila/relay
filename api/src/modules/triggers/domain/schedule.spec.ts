import { nextFireAfter } from './next-fire-time.js';
import { planScheduleFire } from './plan-schedule-fire.js';
import { scheduleSchema, type Schedule } from './schedule.js';
import { scheduleToCron } from './schedule-to-cron.js';

const parse = (value: unknown) => scheduleSchema.parse(value);
const saoPaulo = { timezone: 'America/Sao_Paulo' };

describe('scheduleToCron', () => {
  it.each<[unknown, string]>([
    [{ every: 'minutes', interval: 15 }, '*/15 * * * *'],
    [{ every: 'hours', interval: 2, minute: 30 }, '30 */2 * * *'],
    [{ every: 'day', time: '07:05' }, '5 7 * * *'],
    [
      { every: 'week', weekdays: ['fri', 'mon', 'mon'], time: '09:00' },
      '0 9 * * 1,5',
    ],
    [{ every: 'month', day: 1, time: '18:30' }, '30 18 1 * *'],
  ])('%j → %s', (schedule, cron) => {
    expect(scheduleToCron(parse(schedule))).toBe(cron);
  });
});

describe('scheduleSchema', () => {
  it('defaults to São Paulo time', () => {
    expect(parse({ every: 'day', time: '09:00' }).timezone).toBe(
      'America/Sao_Paulo',
    );
  });

  it.each([
    { every: 'day', time: '9am' },
    { every: 'week', weekdays: [], time: '09:00' },
    { every: 'month', day: 31, time: '09:00' },
    { every: 'day', time: '09:00', timezone: 'Mars/Olympus' },
  ])('rejects %j', (schedule) => {
    expect(scheduleSchema.safeParse(schedule).success).toBe(false);
  });
});

describe('nextFireAfter', () => {
  const mondays: Schedule = parse({
    every: 'week',
    weekdays: ['mon'],
    time: '09:00',
    ...saoPaulo,
  });

  it('fires at local time in the schedule time zone', () => {
    // Sunday noon UTC → Monday 09:00 in São Paulo (UTC-3)
    expect(
      nextFireAfter(mondays, new Date('2026-10-11T12:00:00Z')).toISOString(),
    ).toBe('2026-10-12T12:00:00.000Z');
  });

  it('is strictly after the given moment', () => {
    expect(
      nextFireAfter(mondays, new Date('2026-10-12T12:00:00Z')).toISOString(),
    ).toBe('2026-10-19T12:00:00.000Z');
  });
});

describe('planScheduleFire', () => {
  const daily = parse({ every: 'day', time: '09:00', ...saoPaulo });

  it('fires on time and moves to the next slot', () => {
    const due = new Date('2026-10-12T12:00:00Z');
    expect(
      planScheduleFire(daily, due, new Date('2026-10-12T12:00:02Z')),
    ).toEqual({
      payload: {
        scheduledFor: '2026-10-12T12:00:00.000Z',
        firedAt: '2026-10-12T12:00:02.000Z',
        late: false,
      },
      nextFireAt: new Date('2026-10-13T12:00:00Z'),
    });
  });

  it('catches up once after days off, without replaying each missed day', () => {
    const due = new Date('2026-10-12T12:00:00Z');
    const wokeUp = new Date('2026-10-16T20:00:00Z');
    const fire = planScheduleFire(daily, due, wokeUp);
    expect(fire.payload.late).toBe(true);
    expect(fire.nextFireAt).toEqual(new Date('2026-10-17T12:00:00Z'));
  });
});
