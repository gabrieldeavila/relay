import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { EmailModule } from '../email/email.module.js';
import { ProvidersModule } from '../providers/providers.module.js';
import { TelegramModule } from '../telegram/telegram.module.js';
import { NodeResolver } from './data/node-resolver.js';
import { NodesController } from './delivery/nodes.controller.js';

@Module({
  imports: [ProvidersModule, EmailModule, TelegramModule, AiModule],
  controllers: [NodesController],
  providers: [NodeResolver],
  exports: [NodeResolver],
})
export class NodesModule {}
