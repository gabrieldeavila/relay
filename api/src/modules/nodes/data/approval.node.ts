import { z } from 'zod';
import { approvalDecision } from '../domain/approval-decision.js';
import { defineNode } from '../domain/node-definition.js';
import { waitForEvent } from '../domain/node-result.js';
import { waitDeadline, waitTimeoutFields } from '../domain/wait-timeout.js';

/**
 * Links: `{{ run.resumeUrl }}/<nodeId>/approve` and `/reject`. Opening one shows
 * a confirm button, so link previews in chat apps never answer by themselves.
 */
export const approvalNode = defineNode({
  type: 'flow.approval',
  kind: 'action',
  title: 'Ask for approval',
  description: 'Pauses until someone approves or rejects.',
  config: z.object({
    question: z.string().default('Approve?'),
    ...waitTimeoutFields,
  }),
  outputPorts: ['approved', 'rejected', 'timeout'],
  run: (config, ctx) =>
    Promise.resolve(waitForEvent(waitDeadline(ctx.now(), config))),
  onEvent: approvalDecision,
});
