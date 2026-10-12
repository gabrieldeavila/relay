import { Inject, Injectable } from '@nestjs/common';
import { DraftWorkflows } from '../../builder/data/draft-workflows.js';
import { PlanChecker } from '../../builder/data/plan-checker.js';
import { RunReader } from '../../engine/data/run-reader.js';
import { RunStarter } from '../../engine/data/run-starter.js';
import { WORKFLOW_REPOSITORY } from '../../workflows/delivery/workflows.controller.js';
import { PublishWorkflow } from '../../workflows/domain/publish-workflow.js';
import type { WorkflowRepository } from '../../workflows/domain/workflow.js';

/** Everything Relay's MCP tools use, gathered so each tool file stays small. */
@Injectable()
export class RelayToolDeps {
  constructor(
    @Inject(WORKFLOW_REPOSITORY) readonly workflows: WorkflowRepository,
    readonly drafts: DraftWorkflows,
    readonly checker: PlanChecker,
    readonly publisher: PublishWorkflow,
    readonly starter: RunStarter,
    readonly runs: RunReader,
  ) {}
}
