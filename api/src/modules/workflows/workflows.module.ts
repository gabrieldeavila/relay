import { Module } from '@nestjs/common';
import { RunStarter } from '../engine/data/run-starter.js';
import { EngineModule } from '../engine/engine.module.js';
import { NodeResolver } from '../nodes/data/node-resolver.js';
import { NodesModule } from '../nodes/nodes.module.js';
import type { TriggerRegistry } from '../triggers/domain/trigger-registration.js';
import {
  TRIGGER_REGISTRY,
  TriggersModule,
} from '../triggers/triggers.module.js';
import { DrizzleWorkflowRepository } from './data/drizzle-workflow.repository.js';
import {
  WORKFLOW_REPOSITORY,
  WorkflowsController,
} from './delivery/workflows.controller.js';
import { PublishWorkflow } from './domain/publish-workflow.js';
import { StartDraftTest } from './domain/start-draft-test.js';
import type { WorkflowRepository } from './domain/workflow.js';

@Module({
  imports: [TriggersModule, NodesModule, EngineModule],
  controllers: [WorkflowsController],
  providers: [
    { provide: WORKFLOW_REPOSITORY, useClass: DrizzleWorkflowRepository },
    {
      provide: PublishWorkflow,
      inject: [WORKFLOW_REPOSITORY, TRIGGER_REGISTRY, NodeResolver],
      useFactory: (
        repository: WorkflowRepository,
        triggers: TriggerRegistry,
        nodes: NodeResolver,
      ) =>
        new PublishWorkflow(
          repository,
          (ownerId) => nodes.specsFor(ownerId),
          triggers,
        ),
    },
    {
      provide: StartDraftTest,
      inject: [WORKFLOW_REPOSITORY, NodeResolver, RunStarter],
      useFactory: (
        repository: WorkflowRepository,
        nodes: NodeResolver,
        starter: RunStarter,
      ) =>
        new StartDraftTest(
          repository,
          (ownerId) => nodes.specsFor(ownerId),
          (workflowId, graph, payload) =>
            starter.startTestRun(workflowId, graph, payload),
        ),
    },
  ],
  exports: [WORKFLOW_REPOSITORY, PublishWorkflow],
})
export class WorkflowsModule {}
