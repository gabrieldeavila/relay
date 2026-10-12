import { toolNodeType } from '../../providers/domain/tool-node-type.js';
import type { WorkflowGraph } from '../../workflows/domain/graph.js';
import type { AppNeed, WorkflowTemplate } from './workflow-template.js';

/** A connected app as templates see it. */
export interface ConnectedApp {
  id: string;
  name: string;
  toolNames: string[];
}

export type Instantiated =
  { ok: true; graph: WorkflowGraph } | { ok: false; missingApps: AppNeed[] };

/** Each app the template uses, with the tools it needs from it. */
export function appsUsed(template: WorkflowTemplate) {
  const apps = new Map<string, { app: AppNeed; tools: Set<string> }>();
  for (const { type } of template.nodes) {
    if (typeof type === 'string') continue;
    const entry = apps.get(type.app.key) ?? { app: type.app, tools: new Set() };
    entry.tools.add(type.tool);
    apps.set(type.app.key, entry);
  }
  return [...apps.values()];
}

/**
 * The connection to use for an app: one that has every tool needed, preferring
 * the one named like the app (someone may run two copies of Pincel).
 */
export function matchApp(
  app: AppNeed,
  tools: Set<string>,
  connected: ConnectedApp[],
): ConnectedApp | undefined {
  const able = connected.filter((c) =>
    [...tools].every((tool) => c.toolNames.includes(tool)),
  );
  const sameName = (c: ConnectedApp) =>
    c.name.trim().toLowerCase() === app.name.toLowerCase();
  return able.find(sameName) ?? able[0];
}

/** The template's graph with app tools pointing at the user's connections. */
export function instantiateTemplate(
  template: WorkflowTemplate,
  connected: ConnectedApp[],
): Instantiated {
  const providerOf = new Map<string, string>();
  const missingApps: AppNeed[] = [];
  for (const { app, tools } of appsUsed(template)) {
    const match = matchApp(app, tools, connected);
    if (match) providerOf.set(app.key, match.id);
    else missingApps.push(app);
  }
  if (missingApps.length) return { ok: false, missingApps };

  const nodes = template.nodes.map((node) => ({
    ...node,
    config: structuredClone(node.config),
    type:
      typeof node.type === 'string'
        ? node.type
        : toolNodeType(providerOf.get(node.type.app.key)!, node.type.tool),
  }));
  return {
    ok: true,
    graph: { nodes, edges: template.edges.map((e) => ({ ...e })) },
  };
}
