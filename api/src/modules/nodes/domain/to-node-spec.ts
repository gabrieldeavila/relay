import type { z } from 'zod';
import type { NodeSpec } from '../../workflows/domain/node-spec.js';
import type { NodeDefinition } from './node-definition.js';

/** Graph validation only needs ports and which config fields are required. */
export function toNodeSpec(node: NodeDefinition): NodeSpec {
  const requiredConfig = Object.entries(
    node.config.shape as Record<string, z.ZodType>,
  )
    .filter(([, field]) => !field.safeParse(undefined).success)
    .map(([name]) => name);
  return {
    type: node.type,
    kind: node.kind,
    outputPorts: node.outputPorts,
    requiredConfig,
  };
}
