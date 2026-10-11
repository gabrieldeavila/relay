import { DEFAULT_PORT, type WorkflowGraph } from './graph.js';
import type { NodeSpec } from './node-spec.js';

/** Small catalog for specs: a trigger, a plain action, a branch and a wait. */
export const TEST_SPECS: NodeSpec[] = [
  { type: 'manual', kind: 'trigger', outputPorts: ['out'], requiredConfig: [] },
  {
    type: 'http',
    kind: 'action',
    outputPorts: ['out', 'error'],
    requiredConfig: ['url'],
  },
  { type: 'log', kind: 'action', outputPorts: ['out'], requiredConfig: [] },
  {
    type: 'if',
    kind: 'action',
    outputPorts: ['true', 'false'],
    requiredConfig: [],
  },
  {
    type: 'wait',
    kind: 'action',
    outputPorts: ['out', 'timeout'],
    requiredConfig: [],
  },
];

export const findTestSpec = (type: string) =>
  TEST_SPECS.find((spec) => spec.type === type);

/**
 * Builds a graph from `nodeId:type` names and `source[.port]->target` edges.
 * `testGraph(['t:manual', 'a:log'], ['t->a'])`
 */
export function testGraph(nodes: string[], edges: string[]): WorkflowGraph {
  return {
    nodes: nodes.map((entry) => {
      const [id, type] = entry.split(':');
      const config = type === 'http' ? { url: 'https://example.com' } : {};
      return { id, type, config, position: { x: 0, y: 0 } };
    }),
    edges: edges.map((entry) => {
      const [from, target] = entry.split('->');
      const [source, sourcePort = DEFAULT_PORT] = from.split('.');
      return { id: entry, source, sourcePort, target };
    }),
  };
}
