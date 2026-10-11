import { z } from 'zod';
import { WEBHOOK_TRIGGER } from '../../triggers/domain/trigger-registration.js';
import { defineNode } from '../domain/node-definition.js';
import { done } from '../domain/node-result.js';

/** Output: `{ body, query }` of the request to the workflow's secret URL. */
export const webhookTriggerNode = defineNode({
  type: WEBHOOK_TRIGGER,
  kind: 'trigger',
  title: 'When a web address is called',
  description: 'Runs when another app sends data to this flow’s secret link.',
  config: z.object({}),
  outputPorts: ['out'],
  run: () => Promise.resolve(done(null)),
});
