import { Module } from '@nestjs/common';
import { AccountRepository } from './data/account.repository.js';
import { SecretBox } from './data/secret-box.js';
import { AccountsController } from './delivery/accounts.controller.js';

@Module({
  controllers: [AccountsController],
  providers: [SecretBox, AccountRepository],
  exports: [AccountRepository],
})
export class AccountsModule {}
