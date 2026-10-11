import { findTestSpec, testGraph } from './test-graph.js';
import { validateGraph } from './validate-graph.js';

const validate = (nodes: string[], edges: string[]) =>
  validateGraph(testGraph(nodes, edges), findTestSpec);

describe('validateGraph', () => {
  it('accepts a branching flow that merges again', () => {
    expect(
      validate(
        ['t:manual', 'check:if', 'yes:log', 'no:log', 'end:log'],
        [
          't->check',
          'check.true->yes',
          'check.false->no',
          'yes->end',
          'no->end',
        ],
      ),
    ).toEqual([]);
  });

  it('requires exactly one trigger', () => {
    expect(validate(['a:log'], [])).toEqual([{ code: 'no_trigger' }]);
    expect(validate(['t1:manual', 't2:manual'], [])).toEqual([
      { code: 'multiple_triggers', nodeId: 't2' },
    ]);
  });

  it('rejects edges into the trigger', () => {
    expect(validate(['t:manual', 'a:log'], ['t->a', 'a->t'])).toContainEqual({
      code: 'trigger_has_input',
      nodeId: 't',
    });
  });

  it('reports the cycle path', () => {
    expect(
      validate(['t:manual', 'a:log', 'b:log'], ['t->a', 'a->b', 'b->a']),
    ).toEqual([{ code: 'cycle', path: ['a', 'b'] }]);
  });

  it('reports nodes the trigger never reaches', () => {
    expect(validate(['t:manual', 'a:log', 'orphan:log'], ['t->a'])).toEqual([
      { code: 'unreachable_node', nodeId: 'orphan' },
    ]);
  });

  it('rejects ports the node does not have', () => {
    expect(validate(['t:manual', 'a:log'], ['t.true->a'])).toEqual([
      { code: 'invalid_port', edgeId: 't.true->a', field: 'true' },
    ]);
  });

  it('rejects edges to missing nodes and unknown node types', () => {
    expect(validate(['t:manual', 'x:nope'], ['t->x', 't->ghost'])).toEqual([
      { code: 'unknown_node_type', nodeId: 'x' },
      { code: 'edge_unknown_node', edgeId: 't->ghost' },
    ]);
  });

  it('reports blank required config', () => {
    const graph = testGraph(['t:manual', 'call:http'], ['t->call']);
    graph.nodes[1].config.url = '  ';
    expect(validateGraph(graph, findTestSpec)).toEqual([
      { code: 'missing_config', nodeId: 'call', field: 'url' },
    ]);
  });

  it('stops at duplicate node ids', () => {
    expect(validate(['t:manual', 't:log'], [])).toEqual([
      { code: 'duplicate_node_id', nodeId: 't' },
    ]);
  });
});
