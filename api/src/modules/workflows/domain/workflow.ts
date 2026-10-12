import type { WorkflowGraph } from './graph.js';

export interface WorkflowSummary {
  id: string;
  name: string;
  /** Null until the first publish. */
  latestVersion: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workflow extends WorkflowSummary {
  draftGraph: WorkflowGraph;
}

export interface WorkflowChanges {
  name?: string;
  draftGraph?: WorkflowGraph;
}

/** Every read and write is scoped to the owner; others' workflows look missing. */
export interface WorkflowRepository {
  create(ownerId: string, name: string): Promise<Workflow>;
  list(ownerId: string): Promise<WorkflowSummary[]>;
  find(id: string, ownerId: string): Promise<Workflow | null>;
  update(
    id: string,
    ownerId: string,
    changes: WorkflowChanges,
  ): Promise<Workflow | null>;
  /** Stores an immutable version and returns its number (1, 2, …). Check ownership first. */
  addVersion(id: string, graph: WorkflowGraph): Promise<number>;
}
