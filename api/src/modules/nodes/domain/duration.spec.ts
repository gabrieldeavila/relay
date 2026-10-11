import { toMilliseconds } from './duration.js';

describe('toMilliseconds', () => {
  it('converts each unit', () => {
    expect(toMilliseconds(30, 'seconds')).toBe(30_000);
    expect(toMilliseconds(2, 'minutes')).toBe(120_000);
    expect(toMilliseconds(1.5, 'hours')).toBe(5_400_000);
    expect(toMilliseconds(1, 'days')).toBe(86_400_000);
  });
});
