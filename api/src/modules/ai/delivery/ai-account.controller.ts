import { Controller, NotFoundException, Post } from '@nestjs/common';
import { AccountRepository } from '../../accounts/data/account.repository.js';
import { CurrentUser } from '../../auth/delivery/current-user.decorator.js';
import { ClaudeClient } from '../data/claude-client.js';

@Controller('accounts/ai')
export class AiAccountController {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly claude: ClaudeClient,
  ) {}

  /** Tries the saved key; a refusal comes back as `ok: false`. */
  @Post('check')
  async check(@CurrentUser() userId: string) {
    const account = await this.accounts.find(userId, 'ai');
    if (!account) throw new NotFoundException('AI account not set up');
    try {
      await this.claude.check(account.secret);
      return { ok: true, message: 'The API key works' };
    } catch (error) {
      return { ok: false, message: (error as Error).message };
    }
  }
}
