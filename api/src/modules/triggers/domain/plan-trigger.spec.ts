import type { WorkflowGraph } from '../../workflows/domain/graph.js';
import type { NodeSpec } from '../../workflows/domain/node-spec.js';
import { planTrigger } from './plan-trigger.js';

const specs: NodeSpec[] = [
  'trigger.manual',
  'trigger.schedule',
  'trigger.webhook',
].map((type) => ({
  type,
  kind: 'trigger',
  outputPorts: ['out'],
  requiredConfig: [],
}));
const findSpec = (type: string) => specs.find((spec) => spec.type === type);

const withTrigger = (type: string, config = {}): WorkflowGraph => ({
  nodes: [{ id: 'start', type, config, position: { x: 0, y: 0 } }],
  edges: [],
});

describe('planTrigger', () => {
  it('registers nothing for a manual start', () => {
    expect(planTrigger(withTrigger('trigger.manual'), findSpec)).toEqual({
      registration: null,
    });
  });

  it('registers a webhook', () => {
    expect(planTrigger(withTrigger('trigger.webhook'), findSpec)).toEqual({
      registration: { kind: 'webhook' },
    });
  });

  it('registers a parsed schedule', () => {
    const graph = withTrigger('trigger.schedule', {
      schedule: { every: 'day', time: '09:00' },
    });
    expect(planTrigger(graph, findSpec)).toEqual({
      registration: {
        kind: 'schedule',
        schedule: {
          every: 'day',
          time: '09:00',
          timezone: 'America/Sao_Paulo',
        },
      },
    });
  });

  it('points at the schedule when it is invalid', () => {
    const graph = withTrigger('trigger.schedule', {
      schedule: { every: 'day', time: '25:00' },
    });
    expect(planTrigger(graph, findSpec)).toEqual({
      issue: { code: 'invalid_config', nodeId: 'start', field: 'schedule' },
    });
  });
});
