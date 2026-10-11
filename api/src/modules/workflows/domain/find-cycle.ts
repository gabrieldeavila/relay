import type { GraphIndex } from './graph-index.js';

type Mark = 'visiting' | 'done';

/** Node ids forming the first cycle found (in order), or null for a DAG. */
export function findCycle(index: GraphIndex): string[] | null {
  const marks = new Map<string, Mark>();
  const path: string[] = [];

  const visit = (nodeId: string): string[] | null => {
    const mark = marks.get(nodeId);
    if (mark === 'done') return null;
    if (mark === 'visiting') return path.slice(path.indexOf(nodeId));

    marks.set(nodeId, 'visiting');
    path.push(nodeId);
    for (const edge of index.outgoing.get(nodeId) ?? []) {
      const cycle = visit(edge.target);
      if (cycle) return cycle;
    }
    path.pop();
    marks.set(nodeId, 'done');
    return null;
  };

  for (const nodeId of index.nodes.keys()) {
    const cycle = visit(nodeId);
    if (cycle) return cycle;
  }
  return null;
}
