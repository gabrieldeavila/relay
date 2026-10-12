import { Injectable } from '@nestjs/common';
import { NodeResolver } from '../../nodes/data/node-resolver.js';
import {
  toCatalogEntry,
  type CatalogEntry,
} from '../../nodes/domain/to-catalog-entry.js';
import type { WorkflowGraph } from '../../workflows/domain/graph.js';
import { checkPlan, type PlanIssue } from '../domain/check-plan.js';

export interface OwnerCatalog {
  catalog: CatalogEntry[];
  check: (graph: WorkflowGraph) => PlanIssue[];
}

/** A user's node catalog, and checks against it (built-in nodes plus their apps). */
@Injectable()
export class PlanChecker {
  constructor(private readonly nodes: NodeResolver) {}

  async forOwner(ownerId: string): Promise<OwnerCatalog> {
    const [definitions, findSpec] = await Promise.all([
      this.nodes.catalogFor(ownerId),
      this.nodes.specsFor(ownerId),
    ]);
    const catalog = definitions.map(toCatalogEntry);
    return {
      catalog,
      check: (graph) => checkPlan(graph, catalog, findSpec),
    };
  }
}
