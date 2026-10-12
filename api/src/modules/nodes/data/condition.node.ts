import { z } from 'zod';
import {
  CONDITION_OPERATORS,
  evaluateCondition,
} from '../domain/evaluate-condition.js';
import { defineNode } from '../domain/node-definition.js';
import { done } from '../domain/node-result.js';

export const conditionNode = defineNode({
  type: 'logic.if',
  kind: 'action',
  title: 'If',
  description: 'Goes one way or the other depending on a value.',
  config: z.object({
    value: z.unknown(),
    operator: z.enum(CONDITION_OPERATORS),
    compare: z.unknown().optional(),
  }),
  output: '`{ passed }`; goes on through `true` or `false`',
  outputPorts: ['true', 'false'],
  run({ value, operator, compare }) {
    const passed = evaluateCondition(value, operator, compare);
    return Promise.resolve(done({ passed }, passed ? 'true' : 'false'));
  },
});
