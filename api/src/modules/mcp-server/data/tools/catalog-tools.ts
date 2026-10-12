import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import type { CatalogEntry } from '../../../nodes/domain/to-catalog-entry.js';
import { jsonResult } from '../../domain/tool-result.js';
import type { RelayToolDeps } from '../relay-tool-deps.js';

/** `list_step_types`: what a workflow can be made of, for this user. */
export function registerCatalogTools(
  server: McpServer,
  deps: RelayToolDeps,
  ownerId: string,
) {
  server.registerTool(
    'list_step_types',
    {
      title: 'List step types',
      description:
        'The triggers and actions a Relay workflow can use (built in, plus tools of the apps the user connected). Call without arguments for the overview, then with `types` to get the settings schema of the ones you will use.',
      inputSchema: z.object({
        types: z
          .array(z.string())
          .optional()
          .describe('Step types to describe in full, with their config schema'),
      }),
      annotations: { readOnlyHint: true },
    },
    async ({ types }) => {
      const { catalog } = await deps.checker.forOwner(ownerId);
      if (!types?.length) return jsonResult(catalog.map(overview));
      const wanted = new Set(types);
      return jsonResult(catalog.filter((entry) => wanted.has(entry.type)));
    },
  );
}

function overview(entry: CatalogEntry) {
  return {
    type: entry.type,
    kind: entry.kind,
    title: entry.title,
    description: entry.description,
    ...(entry.group ? { app: entry.group } : {}),
    ports: entry.outputPorts,
    ...(entry.output ? { output: entry.output } : {}),
    required: entry.requiredConfig,
  };
}
