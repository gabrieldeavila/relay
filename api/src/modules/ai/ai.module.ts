import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module.js';
import { AiNode } from './data/ai.node.js';
import { ClaudeClient } from './data/claude-client.js';
import { AiAccountController } from './delivery/ai-account.controller.js';

@Module({
  imports: [AccountsModule],
  controllers: [AiAccountController],
  providers: [ClaudeClient, AiNode],
  exports: [AiNode],
})
export class AiModule {}
