import { Module } from '@nestjs/common';
import { AccountsModule } from './modules/accounts/accounts.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { DatabaseModule } from './database/database.module.js';
import { EngineModule } from './modules/engine/engine.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { NodesModule } from './modules/nodes/nodes.module.js';
import { TemplatesModule } from './modules/templates/templates.module.js';
import { WorkflowsModule } from './modules/workflows/workflows.module.js';

@Module({
  imports: [
    AuthModule,
    AccountsModule,
    DatabaseModule,
    HealthModule,
    NodesModule,
    WorkflowsModule,
    EngineModule,
    TemplatesModule,
  ],
})
export class AppModule {}
