import { Injectable } from '@nestjs/common';
import { openAsBlob } from 'node:fs';
import { basename } from 'node:path';
import { StepFailure } from '../../nodes/domain/step-failure.js';
import { classifyTelegramError } from '../domain/classify-telegram-error.js';
import type { TelegramCall } from '../domain/plan-telegram-send.js';

interface BotReply<T> {
  ok: boolean;
  result?: T;
  description?: string;
}

/** Telegram Bot API; TELEGRAM_API_URL points it at a fake one in tests. */
@Injectable()
export class TelegramClient {
  private get baseUrl() {
    return process.env.TELEGRAM_API_URL ?? 'https://api.telegram.org';
  }

  /** Runs one planned call; returns the sent message's id. */
  async send(
    token: string,
    chatId: string,
    call: TelegramCall,
    signal?: AbortSignal,
  ): Promise<number> {
    const message =
      call.method === 'sendMessage'
        ? await this.request<{ message_id: number }>(token, call.method, {
            json: { chat_id: chatId, text: call.text },
            signal,
          })
        : await this.request<{ message_id: number }>(token, call.method, {
            form: await photoForm(chatId, call.photoPath, call.caption),
            signal,
          });
    return message.message_id;
  }

  getMe(token: string) {
    return this.request<{ username: string }>(token, 'getMe', {});
  }

  /** Recent messages to the bot (kept by Telegram for 24 hours). */
  getUpdates(token: string) {
    return this.request<unknown[]>(token, 'getUpdates', {
      json: { allowed_updates: ['message', 'channel_post', 'my_chat_member'] },
    });
  }

  private async request<T>(
    token: string,
    method: string,
    {
      json,
      form,
      signal,
    }: { json?: unknown; form?: FormData; signal?: AbortSignal },
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}/bot${token}/${method}`, {
      method: 'POST',
      signal: signal ?? AbortSignal.timeout(30_000),
      headers: json ? { 'content-type': 'application/json' } : undefined,
      body: form ?? JSON.stringify(json ?? {}),
    });
    const reply = (await response
      .json()
      .catch(() => null)) as BotReply<T> | null;
    if (response.ok && reply?.ok) return reply.result as T;
    throw new StepFailure(
      classifyTelegramError(
        response.status,
        reply?.description ?? response.statusText,
      ),
    );
  }
}

async function photoForm(chatId: string, path: string, caption?: string) {
  const form = new FormData();
  form.set('chat_id', chatId);
  if (caption) form.set('caption', caption);
  form.set('photo', await openAsBlob(path), basename(path));
  return form;
}
