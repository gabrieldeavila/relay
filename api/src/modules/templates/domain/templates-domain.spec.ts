import { validateGraph } from '../../workflows/domain/validate-graph.js';
import type { NodeSpec } from '../../workflows/domain/node-spec.js';
import { TEMPLATES } from './catalog/index.js';
import { quoteOfTheWeek } from './catalog/quote-of-the-week.js';
import { describeTemplate } from './describe-template.js';
import {
  instantiateTemplate,
  type ConnectedApp,
} from './instantiate-template.js';

const pincel: ConnectedApp = {
  id: 'p1',
  name: 'Pincel',
  toolNames: ['create_document', 'draw_text', 'render_image', 'undo'],
};

describe('instantiateTemplate', () => {
  it('points app tools at the matching connection', () => {
    const result = instantiateTemplate(quoteOfTheWeek, [pincel]);
    if (!result.ok) throw new Error('expected a graph');
    const types = result.graph.nodes.map((node) => node.type);
    expect(types).toContain('tool:p1:draw_text');
    expect(types).toContain('tool:p1:render_image');
    expect(types).toContain('telegram.send');
  });

  it('prefers the connection named like the app among those able', () => {
    const copy = { ...pincel, id: 'p2', name: 'Drawing app' };
    const result = instantiateTemplate(quoteOfTheWeek, [copy, pincel]);
    expect(result.ok && result.graph.nodes[2].type).toBe(
      'tool:p1:create_document',
    );
  });

  it('reports a missing app instead of a broken graph', () => {
    const older = { ...pincel, toolNames: ['draw_text'] };
    expect(instantiateTemplate(quoteOfTheWeek, [older])).toEqual({
      ok: false,
      missingApps: [{ key: 'pincel', name: 'Pincel' }],
    });
  });

  it('never shares config objects between workflows', () => {
    const first = instantiateTemplate(quoteOfTheWeek, [pincel]);
    if (!first.ok) throw new Error('expected a graph');
    first.graph.nodes[1].config.path = '/mine.csv';
    expect(quoteOfTheWeek.nodes[1].config.path).toBe('');
  });
});

describe('describeTemplate', () => {
  it('lists what is ready and blocks only on missing apps', () => {
    expect(describeTemplate(quoteOfTheWeek, [], ['telegram'])).toMatchObject({
      canUse: false,
      needs: [
        { kind: 'app', key: 'pincel', ready: false },
        { kind: 'account', key: 'telegram', ready: true },
      ],
    });
    expect(describeTemplate(quoteOfTheWeek, [pincel], []).canUse).toBe(true);
  });
});

describe('every template', () => {
  // Shape-only specs: ports and ids, as the real catalog would give them.
  const spec = (type: string): NodeSpec => ({
    type,
    kind: type.startsWith('trigger.') ? 'trigger' : 'action',
    outputPorts:
      type === 'flow.approval'
        ? ['approved', 'rejected', 'timeout']
        : ['out', 'error'],
    requiredConfig: [],
  });

  it.each(TEMPLATES.map((t) => [t.id, t] as const))(
    '%s is a valid flow once instantiated',
    (_id, template) => {
      const result = instantiateTemplate(template, [pincel]);
      if (!result.ok) throw new Error('expected a graph');
      expect(validateGraph(result.graph, spec)).toEqual([]);
    },
  );
});
