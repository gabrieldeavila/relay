import type { WorkflowGraph } from '../../workflows/domain/graph.js';

const TEMPLATE = /\{\{\s*([^}]*?)\s*\}\}/g;
const ROOTS = new Set(['trigger', 'run', 'steps']);
const RUN_VALUES = new Set(['id', 'resumeUrl', 'link']);

export interface BadReference {
  nodeId: string;
  /** The expression as written, e.g. `steps.draw.output.url`. */
  expression: string;
}

/**
 * `{{ }}` values that can never resolve: an unknown root, a run value that
 * does not exist, or a step id that is not in the flow.
 */
export function findBadReferences(graph: WorkflowGraph): BadReference[] {
  const ids = new Set(graph.nodes.map((node) => node.id));
  return graph.nodes.flatMap((node) =>
    expressionsIn(node.config)
      .filter((expression) => !resolvable(expression, ids))
      .map((expression) => ({ nodeId: node.id, expression })),
  );
}

function resolvable(expression: string, ids: Set<string>): boolean {
  const [root, second] = expression.split(/[.[]/);
  if (!ROOTS.has(root)) return false;
  if (root === 'run') return RUN_VALUES.has(second ?? '');
  if (root === 'steps') return ids.has(second ?? '');
  return true;
}

function expressionsIn(value: unknown): string[] {
  if (typeof value === 'string') {
    return [...value.matchAll(TEMPLATE)].map((match) => match[1]);
  }
  if (Array.isArray(value)) return value.flatMap(expressionsIn);
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(expressionsIn);
  }
  return [];
}
