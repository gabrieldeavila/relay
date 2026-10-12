import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { uiUrl } from '../../../../ui-url.js';
import { withMessages } from '../../../builder/domain/describe-issue.js';
import { graphToPlan } from '../../../builder/domain/plan-to-graph.js';
import { editorLink } from '../../domain/relay-links.js';
import { errorResult, jsonResult } from '../../domain/tool-result.js';
import type { RelayToolDeps } from '../relay-tool-deps.js';

const RECENT_RUNS = 5;

/** `list_workflows` and `get_workflow`. */
export function registerWorkflowReadTools(
  server: McpServer,
  deps: RelayToolDeps,
  ownerId: string,
) {
  server.registerTool(
    'list_workflows',
    {
      title: 'List workflows',
      description:
        "The user's Relay workflows: id, name, the published version (null if never published) and a link to edit it.",
      annotations: { readOnlyHint: true },
    },
    async () => {
      const workflows = await deps.workflows.list(ownerId);
      return jsonResult(
        workflows.map((workflow) => ({
          id: workflow.id,
          name: workflow.name,
          publishedVersion: workflow.latestVersion,
          updatedAt: workflow.updatedAt.toISOString(),
          link: editorLink(uiUrl(), workflow.id),
        })),
      );
    },
  );

  server.registerTool(
    'get_workflow',
    {
      title: 'Get a workflow',
      description:
        "A workflow's draft as steps and links (the format save_workflow takes), what still keeps it from being published, and its latest runs.",
      inputSchema: z.object({ workflowId: z.uuid() }),
      annotations: { readOnlyHint: true },
    },
    async ({ workflowId }) => {
      const workflow = await deps.workflows.find(workflowId, ownerId);
      if (!workflow) return errorResult('No workflow with this id');
      const [{ check }, runs] = await Promise.all([
        deps.checker.forOwner(ownerId),
        deps.runs.listForWorkflow(workflowId, ownerId, RECENT_RUNS),
      ]);
      return jsonResult({
        id: workflow.id,
        name: workflow.name,
        publishedVersion: workflow.latestVersion,
        link: editorLink(uiUrl(), workflow.id),
        draft: graphToPlan(workflow.draftGraph),
        issues: withMessages(check(workflow.draftGraph)),
        recentRuns: runs.map((run) => ({
          id: run.id,
          status: run.status,
          version: run.version,
          startedAt: run.createdAt.toISOString(),
        })),
      });
    },
  );
}
