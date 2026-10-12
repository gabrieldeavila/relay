import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module.js';
import { ProviderRepository } from './data/drizzle-provider.repository.js';
import { McpConnections } from './data/mcp-connections.js';
import { McpToolClient } from './data/mcp-tool.client.js';
import { ToolCaller } from './data/tool-caller.js';
import { ToolNodes } from './data/tool-nodes.js';
import { ToolProviderClient } from './data/tool-provider.client.js';
import { ProvidersController } from './delivery/providers.controller.js';

@Module({
  imports: [FilesModule],
  controllers: [ProvidersController],
  providers: [
    ProviderRepository,
    ToolProviderClient,
    McpConnections,
    McpToolClient,
    ToolCaller,
    ToolNodes,
  ],
  exports: [ToolNodes, ProviderRepository],
})
export class ProvidersModule {}
