import type { PlanIssue } from './check-plan.js';

/** One plain sentence per issue, for an AI to fix or a person to read. */
export function describeIssue(issue: PlanIssue): string {
  const step = `Step "${issue.nodeId ?? '?'}"`;
  switch (issue.code) {
    case 'no_trigger':
      return 'The flow needs one trigger (a step of kind "trigger") to start it.';
    case 'multiple_triggers':
      return `${step} is a second trigger; a flow has exactly one.`;
    case 'duplicate_node_id':
      return `${step} appears more than once; step ids must be unique.`;
    case 'unknown_node_type':
      return `${step} has a type that does not exist; use a type from the catalog.`;
    case 'missing_config':
      return `${step} needs "${issue.field}" filled in.`;
    case 'invalid_config':
      return `${step} has a value for "${issue.field}" that is not valid.`;
    case 'unknown_config':
      return `${step} has a setting "${issue.field}" its type does not have; use the names in its config schema.`;
    case 'bad_reference':
      return `${step} uses {{ ${issue.field} }}, which does not exist; use trigger…, run.link, run.resumeUrl or steps.<id of a step in this flow>…`;
    case 'edge_unknown_node':
      return `Link "${issue.edgeId}" points at a step that does not exist.`;
    case 'invalid_port':
      return `Link "${issue.edgeId}" leaves through "${issue.field}", which that step does not have; use one of its output ports.`;
    case 'trigger_has_input':
      return `${step} is a trigger, so nothing can link into it.`;
    case 'cycle':
      return `Steps ${issue.path?.join(' → ')} form a loop; flows go one way.`;
    case 'unreachable_node':
      return `${step} is not linked from the trigger, so it would never run.`;
  }
}

/** Issues with their sentence, as the API and MCP tools answer them. */
export const withMessages = (issues: PlanIssue[]) =>
  issues.map((issue) => ({ ...issue, message: describeIssue(issue) }));
