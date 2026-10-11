import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE, type Database } from '../../../database/database.js';
import { workflowVersions } from '../../../database/schema/index.js';
import { findNodeSpec } from '../../nodes/data/node-catalog.js';
import { findTrigger } from '../../workflows/domain/find-trigger.js';
import type { GraphNode, WorkflowGraph } from '../../workflows/domain/graph.js';
import {
  indexGraph,
  type GraphIndex,
} from '../../workflows/domain/graph-index.js';

export interface VersionGraph {
  graph: WorkflowGraph;
  index: GraphIndex;
  trigger: GraphNode;
}

/** Published versions never change, so their graphs are cached for good. */
@Injectable()
export class VersionGraphs {
  private readonly cache = new Map<string, VersionGraph>();

  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async get(versionId: string): Promise<VersionGraph> {
    const cached = this.cache.get(versionId);
    if (cached) return cached;

    const [row] = await this.db
      .select({ graph: workflowVersions.graph })
      .from(workflowVersions)
      .where(eq(workflowVersions.id, versionId));
    const trigger = row && findTrigger(row.graph, findNodeSpec);
    if (!row || !trigger) {
      throw new NotFoundException(`Version ${versionId} not found`);
    }
    const loaded = { graph: row.graph, index: indexGraph(row.graph), trigger };
    this.cache.set(versionId, loaded);
    return loaded;
  }
}
