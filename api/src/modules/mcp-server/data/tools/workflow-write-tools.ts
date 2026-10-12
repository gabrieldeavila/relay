import type { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { uiUrl } from '../../../../ui-url.js';
import { withMessages } from '../../../builder/domain/describe-issue.js';
import { flowPlanSchema } from '../../../builder/domain/flow-plan.js';
import { planToGraph } from '../../../builder/domain/plan-to-graph.js';
import { editorLink } from '../../domain/relay-links.js';
import { errorResult, jsonResult } from '../../domain/tool-result.js';
import type { RelayToolDeps } from '../relay-tool-deps.js';

const saveInput = flowPlanSchema.extend({
  workflowId: z
    .uuid()
    .optional()
    .describe('Leave out to create a new workflow; give it to replace a draft'),
  name: z.string().trim().min(1).max(120).optional(),
});

/** `save_workflow` (drafts only) and `publish_workflow`. */
export function registerWorkflowWriteTools(
  server: McpServer,
  deps: RelayToolDeps,
  ownerId: string,
) {
  server.registerTool(
    'save_workflow',
    {
      title: 'Save a workflow draft',
      description: `Creates a workflow, or replaces a workflow's draft, from steps and links. Nothing runs and the published version is untouched until publish_workflow.
Steps: { id, type, config } with types and setting names from list_step_types; exactly one trigger. Links: { from, to, port } (port defaults to "out"). Use earlier values with {{ trigger.<field> }}, {{ steps.<id>.output.<field> }}, {{ run.link }}.
Leave personal details you were not given (paths, emails, chat ids) as "" so the user fills them in. The answer lists the issues left; fix all but those blanks.`,
      inputSchema: saveInput,
    },
    async ({ workflowId, name, steps, links }) => {
      const plan = { steps, links };
      const saved = workflowId
        ? await deps.drafts.replace(workflowId, ownerId, plan, name)
        : await deps.drafts.create(
            ownerId,
            name ?? 'New workflow',
            planToGraph(plan),
          );
      if (!saved) return errorResult('No workflow with this id');
      const { check } = await deps.checker.forOwner(ownerId);
      const issues = check(saved.graph);
      return jsonResult({
        id: saved.id,
        link: editorLink(uiUrl(), saved.id),
        readyToPublish: issues.length === 0,
        issues: withMessages(issues),
      });
    },
  );

  server.registerTool(
    'publish_workflow',
    {
      title: 'Publish a workflow',
      description:
        'Makes the current draft the version that runs, and arms its trigger (schedule, web address or folder). Ask the user before publishing.',
      inputSchema: z.object({ workflowId: z.uuid() }),
      annotations: { destructiveHint: false, idempotentHint: false },
    },
    async ({ workflowId }) => {
      const result = await deps.publisher.execute(workflowId, ownerId);
      if (result.type === 'not_found') {
        return errorResult('No workflow with this id');
      }
      if (result.type === 'invalid') {
        return {
          ...jsonResult({
            published: false,
            issues: withMessages(result.issues),
          }),
          isError: true,
        };
      }
      return jsonResult({ published: true, version: result.version });
    },
  );
}
