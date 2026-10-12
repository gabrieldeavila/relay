import { isRetryable } from '../../engine/domain/step-error.js';
import { chatsFromUpdates } from './chats-from-updates.js';
import { classifyTelegramError } from './classify-telegram-error.js';
import {
  CAPTION_LIMIT,
  planTelegramSend,
  splitText,
} from './plan-telegram-send.js';

describe('planTelegramSend', () => {
  it('sends text as one message', () => {
    expect(planTelegramSend({ text: ' Hello ' })).toEqual([
      { method: 'sendMessage', text: 'Hello' },
    ]);
  });

  it('puts short text under the picture', () => {
    expect(planTelegramSend({ text: 'Quote', imagePath: '/a.png' })).toEqual([
      { method: 'sendPhoto', photoPath: '/a.png', caption: 'Quote' },
    ]);
    expect(planTelegramSend({ imagePath: '/a.png' })).toEqual([
      { method: 'sendPhoto', photoPath: '/a.png', caption: undefined },
    ]);
  });

  it('sends text too long for a caption after the picture', () => {
    const text = 'x'.repeat(CAPTION_LIMIT + 1);
    expect(planTelegramSend({ text, imagePath: '/a.png' })).toEqual([
      { method: 'sendPhoto', photoPath: '/a.png' },
      { method: 'sendMessage', text },
    ]);
  });
});

describe('splitText', () => {
  it('cuts long text at a space, never mid-word', () => {
    expect(splitText('aaaa bbbb cccc', 10)).toEqual(['aaaa bbbb', 'cccc']);
  });

  it('cuts hard when there is no space to use', () => {
    expect(splitText('abcdefghij', 4)).toEqual(['abcd', 'efgh', 'ij']);
  });
});

describe('classifyTelegramError', () => {
  it('explains a chat the bot has not seen yet, without retrying', () => {
    const error = classifyTelegramError(400, 'Bad Request: chat not found');
    expect(error.message).toMatch(/send any message to your bot/);
    expect(isRetryable(error)).toBe(false);
  });

  it('retries when Telegram asks to slow down or is down', () => {
    expect(isRetryable(classifyTelegramError(429, 'Too Many Requests'))).toBe(
      true,
    );
    expect(isRetryable(classifyTelegramError(502, 'Bad Gateway'))).toBe(true);
    expect(isRetryable(classifyTelegramError(401, 'Unauthorized'))).toBe(false);
  });
});

describe('chatsFromUpdates', () => {
  it('lists each chat once, newest first, with a readable name', () => {
    expect(
      chatsFromUpdates([
        {
          message: {
            chat: {
              id: 1,
              type: 'private',
              first_name: 'Ana',
              last_name: 'Lima',
            },
          },
        },
        {
          my_chat_member: {
            chat: { id: -100, type: 'channel', title: 'Quotes' },
          },
        },
        { message: { chat: { id: 1, type: 'private', first_name: 'Ana' } } },
        {},
      ]),
    ).toEqual([
      { id: '1', name: 'Ana', type: 'private' },
      { id: '-100', name: 'Quotes', type: 'channel' },
    ]);
  });
});
