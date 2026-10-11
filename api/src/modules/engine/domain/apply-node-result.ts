import type { NodeResult } from '../../nodes/domain/node-result.js';
import { DEFAULT_PORT } from '../../workflows/domain/graph.js';
import type { StepChange } from './step-change.js';

/**
 * A finished attempt follows the node's port (default `out`); a sleep parks
 * the step on a timer; a wait parks it until an event or its deadline.
 */
export function applyNodeResult(
  result: NodeResult,
  input: unknown,
): StepChange {
  switch (result.type) {
    case 'sleep':
      return {
        status: 'waiting',
        waitingFor: 'time',
        runAt: result.until,
        input,
      };
    case 'wait':
      return {
        status: 'waiting',
        waitingFor: 'event',
        deadlineAt: result.deadline ?? null,
        input,
      };
    case 'done':
      return {
        status: 'succeeded',
        port: result.port ?? DEFAULT_PORT,
        output: result.output ?? null,
        input,
      };
  }
}
