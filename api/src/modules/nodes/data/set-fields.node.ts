import { z } from 'zod';
import { defineNode } from '../domain/node-definition.js';
import { done } from '../domain/node-result.js';

/** Names values (often from earlier steps) so later steps can use them. */
export const setFieldsNode = defineNode({
  type: 'data.set',
  kind: 'action',
  title: 'Set fields',
  description: 'Creates named values to use in the next steps.',
  config: z.object({ fields: z.record(z.string(), z.unknown()) }),
  output: 'The fields themselves, by name',
  outputPorts: ['out'],
  run: ({ fields }) => Promise.resolve(done(fields)),
});
