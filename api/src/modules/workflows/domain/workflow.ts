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

export interface WorkflowRepository {
  create(name: string): Promise<Workflow>;
  list(): Promise<WorkflowSummary[]>;
  find(id: string): Promise<Workflow | null>;
  update(id: string, changes: WorkflowChanges): Promise<Workflow | null>;
  /** Stores an immutable version and returns its number (1, 2, …). */
  addVersion(id: string, graph: WorkflowGraph): Promise<number>;
}
