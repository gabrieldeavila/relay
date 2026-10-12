import { z } from 'zod';
import { defineNode } from '../domain/node-definition.js';
import { done } from '../domain/node-result.js';

/** Started from the UI or API; the run payload becomes its output. */
export const manualTriggerNode = defineNode({
  type: 'trigger.manual',
  kind: 'trigger',
  title: 'Start manually',
  description: 'Runs when you press Run, with optional sample data.',
  config: z.object({}),
  output: 'The data given when the run starts (any JSON).',
  outputPorts: ['out'],
  run: () => Promise.resolve(done(null)),
});
