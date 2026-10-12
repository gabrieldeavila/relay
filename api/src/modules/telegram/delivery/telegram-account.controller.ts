import { Controller, Get, NotFoundException, Post } from '@nestjs/common';
import { AccountRepository } from '../../accounts/data/account.repository.js';
import { CurrentUser } from '../../auth/delivery/current-user.decorator.js';
import { TelegramClient } from '../data/telegram-client.js';
import { chatsFromUpdates } from '../domain/chats-from-updates.js';

@Controller('accounts/telegram')
export class TelegramAccountController {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly client: TelegramClient,
  ) {}

  /** Asks Telegram who the bot is; a refused token comes back as `ok: false`. */
  @Post('check')
  async check(@CurrentUser() userId: string) {
    const { secret } = await this.bot(userId);
    try {
      const bot = await this.client.getMe(secret);
      return { ok: true, message: `Connected to @${bot.username}` };
    } catch (error) {
      return { ok: false, message: (error as Error).message };
    }
  }

  /** Chats that wrote to the bot lately, to pick where messages go. */
  @Get('chats')
  async chats(@CurrentUser() userId: string) {
    const { secret } = await this.bot(userId);
    return chatsFromUpdates(
      (await this.client.getUpdates(secret)) as Parameters<
        typeof chatsFromUpdates
      >[0],
    );
  }

  private async bot(userId: string) {
    const account = await this.accounts.find(userId, 'telegram');
    if (!account) throw new NotFoundException('Telegram bot not set up');
    return account;
  }
}
