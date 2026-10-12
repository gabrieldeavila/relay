import { Module } from '@nestjs/common';
import { AccessTokensModule } from '../access-tokens/access-tokens.module.js';
import { BuilderModule } from '../builder/builder.module.js';
import { EngineModule } from '../engine/engine.module.js';
import { WorkflowsModule } from '../workflows/workflows.module.js';
import { RelayMcpServer } from './data/relay-mcp-server.js';
import { RelayToolDeps } from './data/relay-tool-deps.js';
import { McpController } from './delivery/mcp.controller.js';

@Module({
  imports: [AccessTokensModule, BuilderModule, EngineModule, WorkflowsModule],
  controllers: [McpController],
  providers: [RelayToolDeps, RelayMcpServer],
})
export class McpServerModule {}
