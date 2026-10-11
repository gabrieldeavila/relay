import { backoffDelay } from './backoff-delay.js';
import type { RetryPolicy } from './retry-policy.js';

const policy: RetryPolicy = {
  maxAttempts: 10,
  initialDelayMs: 1_000,
  maxDelayMs: 10_000,
  multiplier: 2,
};
const ceilingOf = (attempt: number) => backoffDelay(attempt, policy, () => 1);

describe('backoffDelay', () => {
  it('doubles the ceiling after each failed attempt', () => {
    expect([1, 2, 3, 4].map(ceilingOf)).toEqual([1_000, 2_000, 4_000, 8_000]);
  });

  it('never exceeds the max delay', () => {
    expect(ceilingOf(5)).toBe(10_000);
    expect(ceilingOf(40)).toBe(10_000);
  });

  it('spreads retries anywhere between zero and the ceiling', () => {
    expect(backoffDelay(3, policy, () => 0)).toBe(0);
    expect(backoffDelay(3, policy, () => 0.5)).toBe(2_000);
  });
});
