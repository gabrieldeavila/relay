import { retryableSteps } from './retryable-steps.js';
import type { StepState } from './step-status.js';

describe('retryableSteps', () => {
  it('picks the failures that stopped the run, not handled ones', () => {
    const steps = new Map<string, StepState>([
      ['start', { status: 'succeeded', port: 'out' }],
      ['render', { status: 'failed' }],
      ['ask', { status: 'timed_out' }],
      ['call', { status: 'failed', port: 'error' }],
      ['alert', { status: 'succeeded', port: 'out' }],
    ]);
    expect(retryableSteps(steps)).toEqual(['render', 'ask']);
  });

  it('finds nothing in a run that did not fail', () => {
    expect(
      retryableSteps(
        new Map([['start', { status: 'succeeded', port: 'out' }]]),
      ),
    ).toEqual([]);
  });
});
