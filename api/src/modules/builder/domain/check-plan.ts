import type { CatalogEntry } from '../../nodes/domain/to-catalog-entry.js';
import type { WorkflowGraph } from '../../workflows/domain/graph.js';
import type { GraphIssue } from '../../workflows/domain/graph-issue.js';
import type { FindNodeSpec } from '../../workflows/domain/node-spec.js';
import { validateGraph } from '../../workflows/domain/validate-graph.js';
import { findBadReferences } from './find-bad-references.js';

/**
 * Graph issues, plus what only shows up when a run gets there: settings the
 * step type does not have (a likely typo) and `{{ }}` values that cannot resolve.
 */
export type PlanIssue =
  | GraphIssue
  | { code: 'unknown_config'; nodeId: string; field: string }
  | { code: 'bad_reference'; nodeId: string; field: string };

/**
 * What is wrong with a drafted graph. Empty settings (`missing_config`) are
 * expected: personal details like a folder or a chat are left for the user.
 */
export function checkPlan(
  graph: WorkflowGraph,
  catalog: CatalogEntry[],
  findSpec: FindNodeSpec,
): PlanIssue[] {
  const byType = new Map(catalog.map((entry) => [entry.type, entry]));
  const unknownConfig = graph.nodes.flatMap((node): PlanIssue[] => {
    const known = knownConfigKeys(byType.get(node.type));
    if (!known) return [];
    return Object.keys(node.config)
      .filter((key) => !known.has(key))
      .map((field) => ({ code: 'unknown_config', nodeId: node.id, field }));
  });
  const badReferences = findBadReferences(graph).map(
    ({ nodeId, expression }): PlanIssue => ({
      code: 'bad_reference',
      nodeId,
      field: expression,
    }),
  );
  return [
    ...validateGraph(graph, findSpec),
    ...unknownConfig,
    ...badReferences,
  ];
}

/** Issues an AI should fix before the draft is shown; blanks are not among them. */
export const blockingIssues = (issues: PlanIssue[]) =>
  issues.filter((issue) => issue.code !== 'missing_config');

/** Null when the schema accepts any key (or the type is unknown). */
function knownConfigKeys(entry: CatalogEntry | undefined): Set<string> | null {
  const schema = entry?.configSchema;
  const properties = schema?.properties;
  if (!properties || typeof properties !== 'object') return null;
  const extra = schema.additionalProperties;
  if (extra === true || (typeof extra === 'object' && extra !== null)) {
    return null;
  }
  const keys = Object.keys(properties);
  return keys.length ? new Set(keys) : null;
}
