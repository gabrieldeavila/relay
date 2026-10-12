import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module.js';
import { ProvidersModule } from '../providers/providers.module.js';
import { WorkflowsModule } from '../workflows/workflows.module.js';
import { TemplatesController } from './delivery/templates.controller.js';

@Module({
  imports: [WorkflowsModule, ProvidersModule, AccountsModule],
  controllers: [TemplatesController],
})
export class TemplatesModule {}
