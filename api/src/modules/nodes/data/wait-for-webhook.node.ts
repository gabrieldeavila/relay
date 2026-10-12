import { z } from 'zod';
import { defineNode } from '../domain/node-definition.js';
import { waitForEvent } from '../domain/node-result.js';
import { waitDeadline, waitTimeoutFields } from '../domain/wait-timeout.js';

/** Resumed by POST `{{ run.resumeUrl }}/<nodeId>`; the body becomes its output. */
export const waitForWebhookNode = defineNode({
  type: 'flow.wait_for_webhook',
  kind: 'action',
  title: 'Wait for another app',
  description: 'Pauses until another app calls this step’s link.',
  config: z.object(waitTimeoutFields),
  output: 'The JSON body the other app sent',
  outputPorts: ['out', 'timeout'],
  run: (config, ctx) =>
    Promise.resolve(waitForEvent(waitDeadline(ctx.now(), config))),
  onEvent: ({ action, payload }) =>
    action === null ? { output: payload } : null,
});
