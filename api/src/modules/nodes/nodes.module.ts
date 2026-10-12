import { Module } from '@nestjs/common';
import { ProvidersModule } from '../providers/providers.module.js';
import { NodeResolver } from './data/node-resolver.js';
import { NodesController } from './delivery/nodes.controller.js';

@Module({
  imports: [ProvidersModule],
  controllers: [NodesController],
  providers: [NodeResolver],
  exports: [NodeResolver],
})
export class NodesModule {}
