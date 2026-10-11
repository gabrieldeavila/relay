import { z } from 'zod';
import { StepFailure } from '../../nodes/domain/step-failure.js';
import { ExpressionError } from '../domain/expressions/expression-error.js';
import { AttemptTimeout } from './attempt-timeout.js';
import { toStepError } from './to-step-error.js';

describe('toStepError', () => {
  it('keeps what a node already classified', () => {
    const error = { kind: 'http', status: 503, message: '503' } as const;
    expect(toStepError(new StepFailure(error))).toEqual(error);
  });

  it('treats bad config and expressions as invalid', () => {
    expect(
      toStepError(new ExpressionError('steps.x.output', 'not_found')).kind,
    ).toBe('invalid');
    const parsed = z.object({ url: z.url() }).safeParse({ url: 'nope' });
    expect(toStepError(parsed.error).kind).toBe('invalid');
  });

  it('recognizes timeouts', () => {
    expect(toStepError(new AttemptTimeout(30_000))).toEqual({
      kind: 'timeout',
      message: 'Gave up after 30s without an answer',
    });
  });

  it('recognizes network failures from fetch', () => {
    const error = new TypeError('fetch failed', {
      cause: new Error('connect ECONNREFUSED 127.0.0.1:4300'),
    });
    expect(toStepError(error)).toEqual({
      kind: 'network',
      message: 'connect ECONNREFUSED 127.0.0.1:4300',
    });
  });

  it('falls back to unknown', () => {
    expect(toStepError('boom')).toEqual({ kind: 'unknown', message: 'boom' });
  });
});
