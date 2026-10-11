import type { GraphEdge } from '../../workflows/domain/graph.js';
import { isTerminal, type StepStates } from './step-status.js';

/**
 * `pending`: the source has not finished yet.
 * `active`: the source finished through this edge's port.
 * `dead`: the source was skipped or followed another port.
 */
export type EdgeState = 'pending' | 'active' | 'dead';

export function edgeState(edge: GraphEdge, steps: StepStates): EdgeState {
  const source = steps.get(edge.source);
  if (!source || !isTerminal(source.status)) return 'pending';
  return source.port === edge.sourcePort ? 'active' : 'dead';
}
