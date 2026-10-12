import { z } from 'zod';
import type { NodeKind } from '../../workflows/domain/node-spec.js';
import type { NodeDefinition } from './node-definition.js';
import { toNodeSpec } from './to-node-spec.js';

/** A node type as the palette, the flow builder and MCP clients see it. */
export interface CatalogEntry {
  type: string;
  kind: NodeKind;
  title: string;
  description: string;
  group: string | null;
  outputPorts: readonly string[];
  output: string | null;
  /** JSON Schema of the step's settings (what the editor form is built from). */
  configSchema: Record<string, unknown>;
  requiredConfig: readonly string[];
}

export function toCatalogEntry(node: NodeDefinition): CatalogEntry {
  return {
    type: node.type,
    kind: node.kind,
    title: node.title,
    description: node.description,
    group: node.group ?? null,
    outputPorts: node.outputPorts,
    output: node.output ?? null,
    configSchema:
      node.configJsonSchema ?? z.toJSONSchema(node.config, { io: 'input' }),
    requiredConfig: toNodeSpec(node).requiredConfig,
  };
}
