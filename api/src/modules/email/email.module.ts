import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module.js';
import { EmailNode } from './data/email.node.js';
import { SmtpMailer } from './data/smtp-mailer.js';
import { EmailAccountController } from './delivery/email-account.controller.js';

@Module({
  imports: [AccountsModule],
  controllers: [EmailAccountController],
  providers: [SmtpMailer, EmailNode],
  exports: [EmailNode],
})
export class EmailModule {}
