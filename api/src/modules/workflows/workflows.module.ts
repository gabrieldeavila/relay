import { Module } from '@nestjs/common';
import { findNodeSpec } from '../nodes/data/node-catalog.js';
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
import type { WorkflowRepository } from './domain/workflow.js';

@Module({
  imports: [TriggersModule],
  controllers: [WorkflowsController],
  providers: [
    { provide: WORKFLOW_REPOSITORY, useClass: DrizzleWorkflowRepository },
    {
      provide: PublishWorkflow,
      inject: [WORKFLOW_REPOSITORY, TRIGGER_REGISTRY],
      useFactory: (repository: WorkflowRepository, triggers: TriggerRegistry) =>
        new PublishWorkflow(repository, findNodeSpec, triggers),
    },
  ],
})
export class WorkflowsModule {}
