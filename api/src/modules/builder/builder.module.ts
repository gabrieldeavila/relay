import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module.js';
import { NodesModule } from '../nodes/nodes.module.js';
import { WorkflowsModule } from '../workflows/workflows.module.js';
import { DraftWorkflows } from './data/draft-workflows.js';
import { FlowBuilder } from './data/flow-builder.js';
import { PlanChecker } from './data/plan-checker.js';
import { BuilderController } from './delivery/builder.controller.js';

@Module({
  imports: [AccountsModule, NodesModule, WorkflowsModule],
  controllers: [BuilderController],
  providers: [PlanChecker, FlowBuilder, DraftWorkflows],
  exports: [PlanChecker, DraftWorkflows],
})
export class BuilderModule {}
