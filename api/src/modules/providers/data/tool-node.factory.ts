import { z } from 'zod';
import type { RunFileStore } from '../../files/data/run-file-store.js';
import {
  defineNode,
  type NodeDefinition,
} from '../../nodes/domain/node-definition.js';
import { done } from '../../nodes/domain/node-result.js';
import type { SerialPerKey } from '../domain/serial-per-key.js';
import type { ToolDescriptor } from '../domain/tool-catalog.js';
import { toolNodeType, toolTitle } from '../domain/tool-node-type.js';
import type { ToolProvider } from './drizzle-provider.repository.js';
import type { ToolProviderClient } from './tool-provider.client.js';

export interface ToolNodeDeps {
  client: ToolProviderClient;
  files: RunFileStore;
  /** Calls to one provider never overlap (Pincel edits a single document). */
  serial: SerialPerKey;
}

/**
 * A provider's tool as a node: its JSON Schema is the config, a call is one
 * attempt, and a returned image is saved as a run file.
 * Output: `{ text, data, image: { url, path, mimeType, bytes } | null }`.
 */
export function toolNode(
  provider: ToolProvider,
  tool: ToolDescriptor,
  deps: ToolNodeDeps,
): NodeDefinition {
  return defineNode({
    type: toolNodeType(provider.id, tool.name),
    kind: 'action',
    title: toolTitle(tool.name),
    description: tool.description,
    group: provider.name,
    config: configSchema(tool),
    configJsonSchema: tool.input_schema,
    outputPorts: ['out', 'error'],
    timeoutMs: 120_000,
    async run(config, ctx) {
      const reply = await deps.serial.run(provider.id, () =>
        deps.client.call(provider.baseUrl, tool.name, config, ctx),
      );
      const image = reply.image
        ? await deps.files.save(
            ctx.step.runId,
            ctx.step,
            Buffer.from(reply.image, 'base64'),
            'image/png',
          )
        : null;
      return done({ text: reply.text ?? '', data: reply.data ?? null, image });
    },
  });
}

/** The tool's own schema as a validator; anything it cannot express passes through. */
function configSchema(tool: ToolDescriptor): z.ZodObject {
  try {
    const schema = z.fromJSONSchema(tool.input_schema);
    if (schema instanceof z.ZodObject) return schema;
  } catch {
    // Fall back below: the provider validates its own input anyway.
  }
  return z.looseObject({});
}
