import type { RetryPolicy } from './retry-policy.js';

/**
 * Wait before retrying after `attempt` (1-based) failed: exponential growth
 * capped at `maxDelayMs`, with full jitter so retries from many steps don't
 * hit a recovering service at the same instant.
 */
export function backoffDelay(
  attempt: number,
  policy: RetryPolicy,
  random: () => number = Math.random,
): number {
  const exponential =
    policy.initialDelayMs * policy.multiplier ** Math.max(0, attempt - 1);
  const ceiling = Math.min(policy.maxDelayMs, exponential);
  return Math.round(random() * ceiling);
}
