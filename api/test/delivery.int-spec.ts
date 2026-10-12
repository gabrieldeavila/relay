import { sql } from 'drizzle-orm';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AccountRepository } from '../src/modules/accounts/data/account.repository';
import { AccountsController } from '../src/modules/accounts/delivery/accounts.controller';
import { EmailAccountController } from '../src/modules/email/delivery/email-account.controller';
import { TelegramAccountController } from '../src/modules/telegram/delivery/telegram-account.controller';
import {
  edge,
  EngineHarness,
  node,
  TEST_OWNER,
} from './support/engine-harness';
import { FakeSmtp } from './support/fake-smtp';
import { FakeTelegram } from './support/fake-telegram';
import { TestServer } from './support/test-server';

describe('steps that deliver', () => {
  let engine: EngineHarness;
  let dir: string;
  const smtp = new FakeSmtp();
  const telegram = new FakeTelegram();
  const anthropic = new TestServer();

  beforeAll(async () => {
    process.env.SECRET_KEY_FILE = join(
      tmpdir(),
      `relay-test-key-${process.pid}`,
    );
    await Promise.all([smtp.start(), telegram.start(), anthropic.start()]);
    process.env.TELEGRAM_API_URL = telegram.url;
    process.env.ANTHROPIC_BASE_URL = anthropic.url('').replace(/\/$/, '');
    engine = await EngineHarness.create();
  });
  afterAll(async () => {
    await Promise.all([smtp.stop(), telegram.stop(), anthropic.stop()]);
    await engine.close();
  });
  beforeEach(async () => {
    await engine.reset();
    await engine.db.execute(sql`DELETE FROM relay.accounts`);
    dir = mkdtempSync(join(tmpdir(), 'relay-delivery-'));
    smtp.received.length = 0;
    telegram.calls.length = 0;
    telegram.failures = {};
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  const accounts = () => engine.get(AccountsController);
  const saveEmail = (password = smtp.password) =>
    accounts().save(TEST_OWNER, 'email', {
      settings: { host: '127.0.0.1', port: smtp.port, user: smtp.user },
      secret: password,
    });
  const saveTelegram = (chatId?: string) =>
    accounts().save(TEST_OWNER, 'telegram', {
      settings: chatId ? { chatId } : {},
      secret: '123:bot-token',
    });

  /** Runs `step` once after a manual start and returns it. */
  async function runStep(
    type: string,
    config: Record<string, unknown>,
    payload: unknown = {},
  ) {
    const workflowId = await engine.publish({
      nodes: [node('start', 'trigger.manual'), node('step', type, config)],
      edges: [edge('start', 'step')],
    });
    const runId = await engine.start(workflowId, payload);
    await engine.worker.drain();
    const run = await engine.run(runId);
    return run.steps.find((step) => step.nodeId === 'step')!;
  }

  describe('accounts', () => {
    it('never returns or stores the secret in plain text', async () => {
      const saved = await saveEmail();
      expect(saved).not.toHaveProperty('secret');
      const [row] = await engine.db.execute<{ secret: string }>(
        sql`SELECT secret FROM relay.accounts WHERE kind = 'email'`,
      );
      expect(row.secret).not.toContain(smtp.password);
      expect(row.secret.startsWith('v1:')).toBe(true);
      expect((await accounts().list(TEST_OWNER))[0]).toMatchObject({
        kind: 'email',
        settings: {
          host: '127.0.0.1',
          user: smtp.user,
          port: smtp.port,
          secure: false,
        },
      });
    });

    it('keeps the secret when only the settings change', async () => {
      await saveEmail();
      await accounts().save(TEST_OWNER, 'email', {
        settings: {
          host: '127.0.0.1',
          port: smtp.port,
          user: smtp.user,
          from: 'Relay <me@example.com>',
        },
      });
      const account = await engine
        .get(AccountRepository)
        .find(TEST_OWNER, 'email');
      expect(account?.secret).toBe(smtp.password);
      expect(account?.settings.from).toBe('Relay <me@example.com>');
    });

    it('asks for the secret the first time', async () => {
      await expect(
        accounts().save(TEST_OWNER, 'telegram', { settings: {} }),
      ).rejects.toThrow('Enter the bot token');
    });

    it('checks the saved email account by signing in', async () => {
      await saveEmail('wrong');
      const check = engine.get(EmailAccountController);
      expect(await check.check(TEST_OWNER)).toMatchObject({ ok: false });
      await saveEmail();
      expect(await check.check(TEST_OWNER)).toEqual({
        ok: true,
        message: `Signed in as ${smtp.user}`,
      });
    });
  });

  describe('send an email', () => {
    it('sends to me by default, with the attachment and a stable message id', async () => {
      await saveEmail();
      const attachment = join(dir, 'invoice.pdf');
      writeFileSync(attachment, '%PDF-fake');

      const step = await runStep(
        'email.send',
        {
          subject: 'New file: {{ trigger.name }}',
          text: 'Here it is',
          attachment,
        },
        { name: 'invoice.pdf' },
      );
      expect(step.error).toBeNull();
      expect(step.output).toMatchObject({
        to: [smtp.user],
        accepted: [smtp.user],
      });
      expect(smtp.received).toHaveLength(1);
      const [mail] = smtp.received;
      expect(mail.to).toEqual([smtp.user]);
      expect(mail.raw).toContain('filename=invoice.pdf');
      expect(mail.raw).toMatch(/Message-ID: <[0-9a-f-]+\.step@relay\.local>/);
    });

    it('fails at once with a readable reason', async () => {
      const noAccount = await runStep('email.send', {
        subject: 's',
        text: 't',
      });
      expect(noAccount.error).toMatchObject({
        kind: 'invalid',
        message: 'Set up an email account in Connections first',
      });

      await saveEmail('wrong');
      const refused = await runStep('email.send', { subject: 's', text: 't' });
      expect(refused.status).toBe('failed');
      expect(refused.attempts).toHaveLength(1);
      expect(refused.error).toMatchObject({ kind: 'invalid' });

      const badAddress = await runStep('email.send', {
        to: 'ana@x.com, bia',
        subject: 's',
        text: 't',
      });
      expect(badAddress.error).toMatchObject({
        message: 'Not an email address: bia',
      });
    });
  });

  describe('send on Telegram', () => {
    it('sends a picture with its caption to my chat', async () => {
      await saveTelegram('42');
      const image = join(dir, 'post.png');
      writeFileSync(image, 'png-bytes');

      const step = await runStep('telegram.send', { text: 'Quote', image });
      expect(step.status).toBe('succeeded');
      expect(step.output).toEqual({ chatId: '42', messageIds: [100] });
      const [call] = telegram.calls;
      expect(call).toMatchObject({
        token: '123:bot-token',
        method: 'sendPhoto',
      });
      expect(call.contentType).toContain('multipart/form-data');
      expect(call.body).toContain('png-bytes');
      expect(call.body).toContain('Quote');
    });

    it('uses the chat the step names', async () => {
      await saveTelegram('42');
      await runStep('telegram.send', { text: 'Hi', chatId: '@my_channel' });
      expect(telegram.calls[0]).toMatchObject({
        method: 'sendMessage',
        body: { chat_id: '@my_channel', text: 'Hi' },
      });
    });

    it('explains a chat the bot cannot reach, without retrying', async () => {
      await saveTelegram('42');
      telegram.failures = { sendMessage: [400, 'Bad Request: chat not found'] };
      const step = await runStep('telegram.send', { text: 'Hi' });
      expect(step.attempts).toHaveLength(1);
      expect(step.error).toMatchObject({ kind: 'invalid' });
      expect(step.error?.message).toContain(
        'send any message to your bot first',
      );
    });

    it('lists recent chats to pick from', async () => {
      await saveTelegram();
      telegram.updates = [
        { message: { chat: { id: 42, type: 'private', first_name: 'Ana' } } },
      ];
      expect(
        await engine.get(TelegramAccountController).chats(TEST_OWNER),
      ).toEqual([{ id: '42', name: 'Ana', type: 'private' }]);
    });
  });

  describe('ask AI', () => {
    const reply = (text: string, stop = 'end_turn') => ({
      status: 200,
      body: {
        id: 'msg_1',
        type: 'message',
        role: 'assistant',
        model: 'claude-opus-5-5',
        content: [{ type: 'text', text }],
        stop_reason: stop,
        usage: { input_tokens: 12, output_tokens: 3 },
      },
    });
    const saveKey = () =>
      accounts().save(TEST_OWNER, 'ai', { settings: {}, secret: 'sk-test' });

    it('sends the resolved prompt and returns the text', async () => {
      await saveKey();
      anthropic.reply(reply('Sales went up.'));
      const step = await runStep(
        'ai.generate',
        {
          prompt: 'Summarize: {{ trigger.note }}',
          instructions: 'Be brief',
        },
        { note: 'October sales' },
      );
      expect(step.error).toBeNull();
      expect(step.output).toEqual({
        text: 'Sales went up.',
        truncated: false,
        model: 'claude-opus-5-5',
        usage: { inputTokens: 12, outputTokens: 3 },
      });
      const [request] = anthropic.received;
      expect(request.path).toBe('/v1/messages?beta=true');
      expect(request.headers['x-api-key']).toBe('sk-test');
      expect(request.headers['anthropic-beta']).toContain(
        'server-side-fallback-2026-07-01',
      );
      expect(request.body).toMatchObject({
        model: 'claude-opus-5-5',
        system: 'Be brief',
        messages: [{ role: 'user', content: 'Summarize: October sales' }],
        fallbacks: 'default',
        output_config: { effort: 'medium' },
      });
    });

    it('retries when the API is overloaded, not when the key is refused', async () => {
      await saveKey();
      anthropic.reply(
        {
          status: 529,
          body: {
            type: 'error',
            error: { type: 'overloaded_error', message: 'Overloaded' },
          },
        },
        reply('ok'),
      );
      const overloaded = await runStep('ai.generate', { prompt: 'Hi' });
      expect(overloaded.status).toBe('retrying');

      anthropic.reply({
        status: 401,
        body: {
          type: 'error',
          error: { type: 'authentication_error', message: 'invalid x-api-key' },
        },
      });
      const refused = await runStep('ai.generate', { prompt: 'Hi' });
      expect(refused.status).toBe('failed');
      expect(refused.error).toMatchObject({ kind: 'invalid' });
      expect(refused.error?.message).toContain('Anthropic refused the API key');
    });

    it('fails with the reason when Claude declines', async () => {
      await saveKey();
      anthropic.reply({
        status: 200,
        body: {
          ...reply('').body,
          content: [],
          stop_reason: 'refusal',
          stop_details: {
            type: 'refusal',
            category: null,
            explanation: 'Not something I can help with',
          },
        },
      });
      const step = await runStep('ai.generate', { prompt: 'Hi' });
      expect(step.error).toMatchObject({
        message: 'Claude declined this request: Not something I can help with',
      });
    });
  });
});
