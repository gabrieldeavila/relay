import type { NodeDefinition } from '../domain/node-definition.js';
import { toNodeSpec } from '../domain/to-node-spec.js';
import { approvalNode } from './approval.node.js';
import { conditionNode } from './condition.node.js';
import { delayNode } from './delay.node.js';
import { httpRequestNode } from './http-request.node.js';
import { manualTriggerNode } from './manual-trigger.node.js';
import { scheduleTriggerNode } from './schedule-trigger.node.js';
import { setFieldsNode } from './set-fields.node.js';
import { waitForWebhookNode } from './wait-for-webhook.node.js';
import { webhookTriggerNode } from './webhook-trigger.node.js';

export const NODES: readonly NodeDefinition[] = [
  manualTriggerNode,
  scheduleTriggerNode,
  webhookTriggerNode,
  httpRequestNode,
  delayNode,
  conditionNode,
  setFieldsNode,
  waitForWebhookNode,
  approvalNode,
];

const byType = new Map(NODES.map((node) => [node.type, node]));
const specs = new Map(NODES.map((node) => [node.type, toNodeSpec(node)]));

export const findNode = (type: string) => byType.get(type);
export const findNodeSpec = (type: string) => specs.get(type);
