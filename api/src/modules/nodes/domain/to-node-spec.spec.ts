import { z } from 'zod';
import { defineNode } from './node-definition.js';
import { done } from './node-result.js';
import { toNodeSpec } from './to-node-spec.js';

describe('toNodeSpec', () => {
  it('lists fields without a default or optional marker as required', () => {
    const node = defineNode({
      type: 'test.node',
      kind: 'action',
      title: 'Test',
      description: '',
      config: z.object({
        url: z.string(),
        method: z.string().default('GET'),
        note: z.string().optional(),
      }),
      outputPorts: ['out'],
      run: () => Promise.resolve(done(null)),
    });
    expect(toNodeSpec(node)).toEqual({
      type: 'test.node',
      kind: 'action',
      outputPorts: ['out'],
      requiredConfig: ['url'],
    });
  });
});
