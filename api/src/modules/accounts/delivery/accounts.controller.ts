import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Put,
} from '@nestjs/common';
import { z } from 'zod';
import { CurrentUser } from '../../auth/delivery/current-user.decorator.js';
import { parseBody } from '../../workflows/delivery/workflow-bodies.js';
import { AccountRepository } from '../data/account.repository.js';
import {
  ACCOUNT_SETTINGS,
  isAccountKind,
  type AccountKind,
} from '../domain/account-kinds.js';

const saveBody = z.object({
  settings: z.record(z.string(), z.unknown()).default({}),
  /** Omit to keep the stored one. */
  secret: z.string().trim().min(1).optional(),
});

/** Email, Telegram and AI accounts; checks live next to each service. */
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountRepository) {}

  @Get()
  list(@CurrentUser() userId: string) {
    return this.accounts.list(userId);
  }

  @Put(':kind')
  async save(
    @CurrentUser() userId: string,
    @Param('kind') kind: string,
    @Body() body: unknown,
  ) {
    const accountKind = parseKind(kind);
    const { settings, secret } = parseBody(saveBody, body);
    const parsed = parseBody(ACCOUNT_SETTINGS[accountKind], settings);
    const saved = await this.accounts.save(userId, accountKind, parsed, secret);
    if (!saved) throw new BadRequestException(secretRequired[accountKind]);
    return saved;
  }

  @Delete(':kind')
  @HttpCode(204)
  async remove(@CurrentUser() userId: string, @Param('kind') kind: string) {
    if (!(await this.accounts.remove(userId, parseKind(kind)))) {
      throw new NotFoundException('Account not set up');
    }
  }
}

const secretRequired: Record<AccountKind, string> = {
  email: 'Enter the password',
  telegram: 'Enter the bot token',
  ai: 'Enter the API key',
};

function parseKind(kind: string): AccountKind {
  if (!isAccountKind(kind)) throw new NotFoundException('Unknown account');
  return kind;
}
