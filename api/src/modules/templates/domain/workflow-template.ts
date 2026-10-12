import type { AccountKind } from '../../accounts/domain/account-kinds.js';
import type { GraphEdge } from '../../workflows/domain/graph.js';

/** A connected app a template uses, found among the user's connections. */
export interface AppNeed {
  key: string;
  /** Name it usually has in Connections, e.g. "Pincel". */
  name: string;
}

/** A tool of a connected app; becomes `tool:<providerId>:<tool>` when used. */
export interface AppTool {
  app: AppNeed;
  tool: string;
}

export interface TemplateNode {
  id: string;
  type: string | AppTool;
  config: Record<string, unknown>;
  position: { x: number; y: number };
}

/**
 * A ready-made flow. Personal details (paths, chats) are left blank on
 * purpose: publishing points at exactly those fields.
 */
export interface WorkflowTemplate {
  id: string;
  title: string;
  description: string;
  /** Accounts its steps use; shown so people can set them up first. */
  accounts: AccountKind[];
  nodes: TemplateNode[];
  edges: GraphEdge[];
}

export const PINCEL: AppNeed = { key: 'pincel', name: 'Pincel' };

/** Left-to-right layout helper: the n-th step of the main line. */
export const at = (column: number, row = 0) => ({
  x: column * 300,
  y: row * 160,
});

export const link = (
  source: string,
  target: string,
  sourcePort = 'out',
): GraphEdge => ({
  id: `${source}.${sourcePort}->${target}`,
  source,
  sourcePort,
  target,
});
