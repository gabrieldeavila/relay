import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module.js';
import { TelegramClient } from './data/telegram-client.js';
import { TelegramNode } from './data/telegram.node.js';
import { TelegramAccountController } from './delivery/telegram-account.controller.js';

@Module({
  imports: [AccountsModule],
  controllers: [TelegramAccountController],
  providers: [TelegramClient, TelegramNode],
  exports: [TelegramNode],
})
export class TelegramModule {}
