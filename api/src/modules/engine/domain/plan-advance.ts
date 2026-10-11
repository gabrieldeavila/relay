import type { GraphIndex } from '../../workflows/domain/graph-index.js';
import { nextReadySteps } from './next-ready-steps.js';
import { runStatus, type RunStatus } from './run-status.js';
import type { StepState, StepStates } from './step-status.js';

export interface AdvancePlan {
  ready: string[];
  skipped: string[];
  status: RunStatus;
}

/**
 * After any step settles: which steps to create and the run status they lead
 * to. A failed run creates nothing more; steps already running finish alone.
 */
export function planAdvance(index: GraphIndex, steps: StepStates): AdvancePlan {
  if (runStatus(steps.values()) === 'failed') {
    return { ready: [], skipped: [], status: 'failed' };
  }
  const { ready, skipped } = nextReadySteps(index, steps);
  const after = new Map<string, StepState>(steps);
  ready.forEach((nodeId) => after.set(nodeId, { status: 'ready' }));
  skipped.forEach((nodeId) => after.set(nodeId, { status: 'skipped' }));
  return { ready, skipped, status: runStatus(after.values()) };
}
