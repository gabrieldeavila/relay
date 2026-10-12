import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { AccountRepository } from '../../accounts/data/account.repository.js';
import { requireLocalFile } from '../../files/data/local-file.js';
import { defineNode } from '../../nodes/domain/node-definition.js';
import { done } from '../../nodes/domain/node-result.js';
import { StepFailure } from '../../nodes/domain/step-failure.js';
import { planTelegramSend } from '../domain/plan-telegram-send.js';
import { TelegramClient } from './telegram-client.js';

/** Telegram's limit for photos sent by bots. */
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

/** Output: `{ chatId, messageIds }`. */
@Injectable()
export class TelegramNode {
  readonly definition = defineNode({
    type: 'telegram.send',
    kind: 'action',
    title: 'Send on Telegram',
    description:
      'Your bot sends a message or a picture to you, a group or a channel.',
    config: z.object({
      text: z.string().optional().meta({ widget: 'textarea' }),
      image: z.string().optional(),
      chatId: z.string().default(''),
    }),
    outputPorts: ['out', 'error'],
    timeoutMs: 60_000,
    run: async ({ text, image, chatId }, ctx) => {
      if (!text?.trim() && !image) throw nothingToSend();
      const photo = image
        ? await requireLocalFile(image, MAX_PHOTO_BYTES)
        : undefined;
      const { settings, secret } = await this.accounts.require(
        ctx.ownerId,
        'telegram',
      );
      const chat = chatId.trim() || settings.chatId;
      if (!chat) throw noChat();

      const messageIds: number[] = [];
      for (const call of planTelegramSend({ text, imagePath: photo?.path })) {
        messageIds.push(await this.client.send(secret, chat, call, ctx.signal));
      }
      return done({ chatId: chat, messageIds });
    },
  });

  constructor(
    private readonly accounts: AccountRepository,
    private readonly client: TelegramClient,
  ) {}
}

const nothingToSend = () =>
  new StepFailure({
    kind: 'invalid',
    message: 'Write a message or pick a picture to send',
  });

const noChat = () =>
  new StepFailure({
    kind: 'invalid',
    message:
      'Pick your chat in Connections → Telegram, or fill in the chat for this step',
  });
