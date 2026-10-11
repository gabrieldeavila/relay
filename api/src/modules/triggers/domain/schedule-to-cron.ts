import { WEEKDAYS, type Schedule } from './schedule.js';

/** Five-field cron expression (minute hour day month weekday). */
export function scheduleToCron(schedule: Schedule): string {
  switch (schedule.every) {
    case 'minutes':
      return `*/${schedule.interval} * * * *`;
    case 'hours':
      return `${schedule.minute} */${schedule.interval} * * *`;
    case 'day':
      return `${atTime(schedule.time)} * * *`;
    case 'week':
      return `${atTime(schedule.time)} * * ${weekdayList(schedule.weekdays)}`;
    case 'month':
      return `${atTime(schedule.time)} ${schedule.day} * *`;
  }
}

function atTime(time: string) {
  const [hour, minute] = time.split(':').map(Number);
  return `${minute} ${hour}`;
}

function weekdayList(weekdays: readonly (typeof WEEKDAYS)[number][]) {
  return [...new Set(weekdays.map((day) => WEEKDAYS.indexOf(day)))]
    .sort((left, right) => left - right)
    .join(',');
}
