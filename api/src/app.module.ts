import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module.js';
import { EngineModule } from './modules/engine/engine.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { NodesModule } from './modules/nodes/nodes.module.js';
import { WorkflowsModule } from './modules/workflows/workflows.module.js';

@Module({
  imports: [
    DatabaseModule,
    HealthModule,
    NodesModule,
    WorkflowsModule,
    EngineModule,
  ],
})
export class AppModule {}
