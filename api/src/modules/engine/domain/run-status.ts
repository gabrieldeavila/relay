import { isTerminal, type StepState } from './step-status.js';

export type RunStatus =
  'running' | 'waiting' | 'succeeded' | 'failed' | 'cancelled';

/**
 * Run status from its steps, after `nextReadySteps` has created everything it
 * could. A failure that followed a port is handled and does not fail the run.
 */
export function runStatus(steps: Iterable<StepState>): RunStatus {
  const all = [...steps];
  if (all.some(isUnhandledFailure)) return 'failed';
  if (all.some((step) => step.status === 'cancelled')) return 'cancelled';

  const open = all.filter((step) => !isTerminal(step.status));
  if (open.length === 0) return 'succeeded';
  return open.every((step) => step.status === 'waiting')
    ? 'waiting'
    : 'running';
}

function isUnhandledFailure({ status, port }: StepState) {
  return (status === 'failed' || status === 'timed_out') && !port;
}
