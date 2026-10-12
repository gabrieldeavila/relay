import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { uiUrl } from '../../../../ui-url.js';
import { runLink } from '../../domain/relay-links.js';
import { runReport } from '../../domain/run-report.js';
import { errorResult, jsonResult } from '../../domain/tool-result.js';
import type { RelayToolDeps } from '../relay-tool-deps.js';

/** `run_workflow` and `get_run`. */
export function registerRunTools(
  server: McpServer,
  deps: RelayToolDeps,
  ownerId: string,
) {
  server.registerTool(
    'run_workflow',
    {
      title: 'Run a workflow',
      description:
        'Starts the published version now; `input` becomes the trigger data ({{ trigger.<field> }}). Its steps really act (send messages, call apps), so ask the user first. Answers right away; follow it with get_run.',
      inputSchema: z.object({
        workflowId: z.uuid(),
        input: z.record(z.string(), z.unknown()).optional(),
      }),
      annotations: { destructiveHint: true, openWorldHint: true },
    },
    async ({ workflowId, input }) => {
      if (!(await deps.runs.ownsWorkflow(workflowId, ownerId))) {
        return errorResult('No workflow with this id');
      }
      const runId = await deps.starter.startRun(workflowId, input ?? {});
      if (!runId) return errorResult('Publish the workflow before running it');
      return jsonResult({
        runId,
        link: runLink(uiUrl(), workflowId, runId),
      });
    },
  );

  server.registerTool(
    'get_run',
    {
      title: 'Get a run',
      description:
        "A run's status (running, waiting, succeeded, failed, cancelled) and each step's status, result or error. Large results are shortened; the link shows everything.",
      inputSchema: z.object({ runId: z.uuid() }),
      annotations: { readOnlyHint: true },
    },
    async ({ runId }) => {
      const run = await deps.runs.get(runId, ownerId);
      if (!run) return errorResult('No run with this id');
      return jsonResult(runReport(run, uiUrl()));
    },
  );
}
