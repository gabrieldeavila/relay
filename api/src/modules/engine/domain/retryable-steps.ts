import type { StepState } from './step-status.js';

/**
 * Steps a manual retry starts again: the ones that failed or timed out
 * without a connected port (those are what failed the run). Steps that
 * already succeeded keep their results.
 */
export function retryableSteps(
  steps: ReadonlyMap<string, StepState>,
): string[] {
  return [...steps.entries()]
    .filter(
      ([, { status, port }]) =>
        (status === 'failed' || status === 'timed_out') && !port,
    )
    .map(([nodeId]) => nodeId);
}
