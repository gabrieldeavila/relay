import { Controller, NotFoundException, Post } from '@nestjs/common';
import { AccountRepository } from '../../accounts/data/account.repository.js';
import { CurrentUser } from '../../auth/delivery/current-user.decorator.js';
import { SmtpMailer } from '../data/smtp-mailer.js';

@Controller('accounts/email')
export class EmailAccountController {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly mailer: SmtpMailer,
  ) {}

  /** Signs in to the saved server; a refusal comes back as `ok: false`. */
  @Post('check')
  async check(@CurrentUser() userId: string) {
    const account = await this.accounts.find(userId, 'email');
    if (!account) throw new NotFoundException('Email account not set up');
    try {
      await this.mailer.verify(account);
      return { ok: true, message: `Signed in as ${account.settings.user}` };
    } catch (error) {
      return { ok: false, message: (error as Error).message };
    }
  }
}
