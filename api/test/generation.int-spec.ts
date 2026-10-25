import {
  Client,
  StreamableHTTPClientTransport,
} from '@modelcontextprotocol/client';
import { createCanvas } from '@napi-rs/canvas';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startHttpApp } from './support/http-harness';
import { TestServer } from './support/test-server';

type ToolAnswer = {
  isError?: boolean;
  content: { type: string; text?: string; mimeType?: string }[];
};

process.env.ASSETS_DIR = join(
  mkdtempSync(join(tmpdir(), 'relay-gen-')),
  'assets',
);
const GENERATION_ENV = [
  'IMAGE_AI_PROVIDER',
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
  'IMAGE_AI_BASE_URL',
];

/** A 64x32 PNG with a transparent right half, as the fake image AI's answer. */
function fakePng() {
  const canvas = createCanvas(64, 32);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#d4a017';
  ctx.fillRect(0, 0, 32, 32);
  return canvas.toBuffer('image/png').toString('base64');
}

async function connect(baseUrl: string) {
  const client = new Client({ name: 'test', version: '1.0.0' });
  await client.connect(
    new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp`)),
  );
  return client;
}

describe('image generation is optional', () => {
  afterEach(() => GENERATION_ENV.forEach((name) => delete process.env[name]));

  it('is not offered when no image AI is set up', async () => {
    const http = await startHttpApp();
    const client = await connect(http.baseUrl);
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name)).not.toContain('generate_image');
    expect(client.getInstructions()).not.toContain('generate_image');
    await client.close();
    await http.app.close();
  });

  it('generates a transparent PNG asset through the configured provider', async () => {
    const openai = new TestServer();
    await openai.start();
    process.env.IMAGE_AI_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.IMAGE_AI_BASE_URL = openai.url('/v1');
    const http = await startHttpApp();
    const client = await connect(http.baseUrl);
    try {
      expect(client.getInstructions()).toContain('generate_image');
      openai.reply({ status: 200, body: { data: [{ b64_json: fakePng() }] } });
      const answer = (await client.callTool({
        name: 'generate_image',
        arguments: { prompt: 'A gold "8" balloon', shape: 'portrait' },
      })) as ToolAnswer;
      expect(answer.isError).toBeFalsy();
      expect(answer.content[0].text).toMatch(/Generated 64x32 image as asset/);
      expect(answer.content[1]).toMatchObject({
        type: 'image',
        mimeType: 'image/png',
      });

      const [request] = openai.received;
      expect(request.path).toBe('/v1/images/generations');
      expect(request.headers.authorization).toBe('Bearer sk-test');
      expect(request.body).toMatchObject({
        model: 'gpt-image-1',
        prompt: 'A gold "8" balloon',
        size: '1024x1536',
        background: 'transparent',
        output_format: 'png',
      });

      const assets = (await (await http.call('/assets')).json()) as {
        name: string;
        source: string;
      }[];
      expect(assets[0]).toMatchObject({
        name: 'a-gold-8-balloon.png',
        source: 'generated',
      });

      openai.reply({
        status: 400,
        body: {
          error: { message: 'Your request was rejected by the safety system' },
        },
      });
      const refused = (await client.callTool({
        name: 'generate_image',
        arguments: { prompt: 'something not allowed' },
      })) as ToolAnswer;
      expect(refused.isError).toBe(true);
      expect(refused.content[0].text).toBe(
        'The image AI refused: Your request was rejected by the safety system',
      );
    } finally {
      await client.close();
      await http.app.close();
      await openai.stop();
    }
  });
  it('tells the AI to cut the background out when the provider cannot', async () => {
    const gemini = new TestServer();
    await gemini.start();
    process.env.IMAGE_AI_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'g-test';
    process.env.IMAGE_AI_BASE_URL = gemini.url('/v1beta');
    const http = await startHttpApp();
    const client = await connect(http.baseUrl);
    try {
      gemini.reply({
        status: 200,
        body: {
          candidates: [
            {
              content: {
                parts: [
                  { inlineData: { mimeType: 'image/png', data: fakePng() } },
                ],
              },
            },
          ],
        },
      });
      const answer = (await client.callTool({
        name: 'generate_image',
        arguments: { prompt: 'A gold balloon' },
      })) as ToolAnswer;
      expect(answer.isError).toBeFalsy();
      expect(answer.content[0].text).toContain('select_color');
      const [request] = gemini.received;
      expect(request.path).toBe(
        '/v1beta/models/gemini-2.5-flash-image:generateContent',
      );
      expect(request.headers['x-goog-api-key']).toBe('g-test');
      expect(JSON.stringify(request.body)).toContain(
        'plain solid white background',
      );
      const { tools } = await client.listTools();
      const tool = tools.find((t) => t.name === 'generate_image')!;
      expect(tool.description).toContain('Google Gemini');
      expect(tool.description).toContain('cannot make transparent backgrounds');
    } finally {
      await client.close();
      await http.app.close();
      await gemini.stop();
    }
  });
});
