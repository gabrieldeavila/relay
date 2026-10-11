import type { GraphIndex } from '../../workflows/domain/graph-index.js';
import { edgeState } from './edge-state.js';
import type { StepState, StepStates } from './step-status.js';

export interface NextSteps {
  /** Nodes whose inputs are settled with at least one active edge. */
  ready: string[];
  /** Nodes on branches that were not taken; their own outputs are dead too. */
  skipped: string[];
}

type Decision = 'wait' | 'ready' | 'skip';

/**
 * Decides which nodes without a step can start. A node waits until every
 * incoming edge is settled (join), runs if any of them is active, and is
 * skipped if all are dead. Skips cascade, so this repeats until stable.
 */
export function nextReadySteps(
  index: GraphIndex,
  steps: StepStates,
): NextSteps {
  const known = new Map<string, StepState>(steps);
  const result: NextSteps = { ready: [], skipped: [] };

  let changed = true;
  while (changed) {
    changed = false;
    for (const nodeId of index.nodes.keys()) {
      if (known.has(nodeId)) continue;
      const decision = decide(index, nodeId, known);
      if (decision === 'wait') continue;

      if (decision === 'ready') {
        result.ready.push(nodeId);
        known.set(nodeId, { status: 'ready' });
      } else {
        result.skipped.push(nodeId);
        known.set(nodeId, { status: 'skipped' });
        changed = true;
      }
    }
  }
  return result;
}

function decide(
  index: GraphIndex,
  nodeId: string,
  steps: StepStates,
): Decision {
  const incoming = index.incoming.get(nodeId) ?? [];
  // The trigger step is created when the run starts, never scheduled here.
  if (incoming.length === 0) return 'wait';

  const states = incoming.map((edge) => edgeState(edge, steps));
  if (states.includes('pending')) return 'wait';
  return states.includes('active') ? 'ready' : 'skip';
}
