import { Inject, Injectable } from '@nestjs/common';
import { WORKFLOW_REPOSITORY } from '../../workflows/delivery/workflows.controller.js';
import type { WorkflowGraph } from '../../workflows/domain/graph.js';
import type { WorkflowRepository } from '../../workflows/domain/workflow.js';
import type { FlowPlan } from '../domain/flow-plan.js';
import { planToGraph } from '../domain/plan-to-graph.js';

/** Writes drafted flows as workflow drafts; publishing stays a separate step. */
@Injectable()
export class DraftWorkflows {
  constructor(
    @Inject(WORKFLOW_REPOSITORY)
    private readonly workflows: WorkflowRepository,
  ) {}

  async create(ownerId: string, name: string, graph: WorkflowGraph) {
    const workflow = await this.workflows.create(ownerId, name);
    await this.workflows.update(workflow.id, ownerId, { draftGraph: graph });
    return { id: workflow.id, graph };
  }

  /** Replaces the draft; steps that stay keep their place on the canvas. Null if missing. */
  async replace(id: string, ownerId: string, plan: FlowPlan, name?: string) {
    const current = await this.workflows.find(id, ownerId);
    if (!current) return null;
    const graph = planToGraph(plan, current.draftGraph);
    await this.workflows.update(id, ownerId, { name, draftGraph: graph });
    return { id, graph };
  }
}
