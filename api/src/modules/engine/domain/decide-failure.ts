import { backoffDelay } from './backoff-delay.js';
import type { RetryPolicy } from './retry-policy.js';
import { isRetryable, type StepError } from './step-error.js';

export const ERROR_PORT = 'error';
export const TIMEOUT_PORT = 'timeout';

export type FailureDecision =
  | { status: 'retrying'; runAt: Date }
  /** `port` set: the failure follows the connected port and the run goes on. */
  | { status: 'failed'; port?: string };

export interface FailedAttempt {
  attempt: number;
  error: StepError;
  policy: RetryPolicy;
  /** Output ports with an edge leaving them. */
  connectedPorts: readonly string[];
  now: Date;
  random?: () => number;
}

/** Retry while it can help; then route to the `error` port, or fail the run. */
export function decideFailure({
  attempt,
  error,
  policy,
  connectedPorts,
  now,
  random,
}: FailedAttempt): FailureDecision {
  if (isRetryable(error) && attempt < policy.maxAttempts) {
    const delay = backoffDelay(attempt, policy, random);
    return { status: 'retrying', runAt: new Date(now.getTime() + delay) };
  }
  return connectedPorts.includes(ERROR_PORT)
    ? { status: 'failed', port: ERROR_PORT }
    : { status: 'failed' };
}

export type DeadlineDecision = { status: 'timed_out'; port?: string };

/** A waiting step whose deadline passed: follow `timeout`, or fail the run. */
export function decideDeadline(
  connectedPorts: readonly string[],
): DeadlineDecision {
  return connectedPorts.includes(TIMEOUT_PORT)
    ? { status: 'timed_out', port: TIMEOUT_PORT }
    : { status: 'timed_out' };
}
