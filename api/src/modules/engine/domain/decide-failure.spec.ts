import {
  decideDeadline,
  decideFailure,
  type FailedAttempt,
} from './decide-failure.js';
import { DEFAULT_RETRY_POLICY } from './retry-policy.js';
import { isRetryable, type StepError } from './step-error.js';

const now = new Date('2026-10-12T09:00:00Z');
const timeout: StepError = { kind: 'timeout', message: 'took too long' };
const notFound: StepError = { kind: 'http', status: 404, message: 'Not Found' };

const failed = (overrides: Partial<FailedAttempt>): FailedAttempt => ({
  attempt: 1,
  error: timeout,
  policy: DEFAULT_RETRY_POLICY,
  connectedPorts: ['out'],
  now,
  random: () => 1,
  ...overrides,
});

describe('isRetryable', () => {
  it.each<[StepError, boolean]>([
    [timeout, true],
    [{ kind: 'network', message: 'ECONNREFUSED' }, true],
    [{ kind: 'http', status: 503, message: '' }, true],
    [{ kind: 'http', status: 429, message: '' }, true],
    [notFound, false],
    [{ kind: 'invalid', message: 'url is required' }, false],
  ])('%j → %s', (error, expected) => {
    expect(isRetryable(error)).toBe(expected);
  });
});

describe('decideFailure', () => {
  it('schedules a retry after the backoff', () => {
    expect(decideFailure(failed({ attempt: 2 }))).toEqual({
      status: 'retrying',
      runAt: new Date(now.getTime() + 2_000),
    });
  });

  it('fails the run once attempts run out', () => {
    expect(decideFailure(failed({ attempt: 3 }))).toEqual({ status: 'failed' });
  });

  it('does not retry errors that would repeat', () => {
    expect(decideFailure(failed({ error: notFound }))).toEqual({
      status: 'failed',
    });
  });

  it('routes the failure to a connected error port', () => {
    expect(
      decideFailure(
        failed({ error: notFound, connectedPorts: ['out', 'error'] }),
      ),
    ).toEqual({ status: 'failed', port: 'error' });
  });
});

describe('decideDeadline', () => {
  it('follows the timeout port when connected', () => {
    expect(decideDeadline(['out', 'timeout'])).toEqual({
      status: 'timed_out',
      port: 'timeout',
    });
    expect(decideDeadline(['out'])).toEqual({ status: 'timed_out' });
  });
});
