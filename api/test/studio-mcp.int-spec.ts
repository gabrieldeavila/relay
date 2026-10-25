import {
  Client,
  StreamableHTTPClientTransport,
} from '@modelcontextprotocol/client';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startHttpApp } from './support/http-harness';

type ToolAnswer = {
  isError?: boolean;
  content: (
    | { type: 'text'; text: string }
    | { type: 'image'; data: string; mimeType: string }
  )[];
};

const work = mkdtempSync(join(tmpdir(), 'relay-int-'));
process.env.ASSETS_DIR = join(work, 'assets');
process.env.FONTS_DIR = join(work, 'fonts');

/** 3 s of test pattern with a tone, 320x240. */
function testClip() {
  const path = join(work, 'pattern.mp4');
  execFileSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-f',
    'lavfi',
    '-i',
    'testsrc=size=320x240:rate=30:duration=3',
    '-f',
    'lavfi',
    '-i',
    'sine=frequency=440:duration=3',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-shortest',
    path,
  ]);
  return path;
}

describe('Relay studio over MCP', () => {
  let http: Awaited<ReturnType<typeof startHttpApp>>;
  let client: Client;

  beforeAll(async () => {
    http = await startHttpApp();
    client = new Client({ name: 'test', version: '1.0.0' });
    await client.connect(
      new StreamableHTTPClientTransport(new URL(`${http.baseUrl}/mcp`)),
    );
  });
  afterAll(async () => {
    await client.close();
    await http.app.close();
  });

  async function call(name: string, args: Record<string, unknown> = {}) {
    const result = (await client.callTool({
      name,
      arguments: args,
    })) as ToolAnswer;
    const text = result.content.find((c) => c.type === 'text')?.text ?? '';
    const image = result.content.find((c) => c.type === 'image');
    return { isError: result.isError ?? false, text, image };
  }
  const idIn = (text: string, label: string) =>
    new RegExp(`${label}:? ([0-9a-f-]{36})`).exec(text)![1];

  it('lists image, video and asset tools without name clashes', async () => {
    const { tools } = await client.listTools();
    const names = tools.map((tool) => tool.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'import_media',
        'list_assets',
        'create_image',
        'open_image',
        'render_image',
        'export_image',
        'batch_image',
        'undo_image',
        'create_video',
        'add_clip',
        'add_text',
        'preview_frame',
        'preview_strip',
        'export_video',
        'batch_video',
        'undo_video',
      ]),
    );
    expect(new Set(names).size).toBe(names.length);
    const drawRect = tools.find((tool) => tool.name === 'draw_rect')!;
    expect(drawRect.inputSchema.required).toContain('imageId');
  });

  it('makes an image, sees it, and exports it as an asset', async () => {
    const created = await call('create_image', {
      name: 'Cover',
      width: 320,
      height: 240,
      background: '#112233',
    });
    expect(created.isError).toBe(false);
    const imageId = idIn(created.text, 'imageId');
    const drawn = await call('batch_image', {
      imageId,
      calls: [
        { tool: 'add_layer', input: { name: 'Title' } },
        {
          tool: 'draw_rect',
          input: {
            rect: { x: 20, y: 20, width: 100, height: 50 },
            fill: '#ff0000',
          },
        },
      ],
    });
    expect(drawn.isError).toBe(false);
    const seen = await call('render_image', { imageId, maxSize: 160 });
    expect(seen.image).toMatchObject({ mimeType: 'image/png' });
    const color = await call('sample_color', { imageId, x: 50, y: 40 });
    expect(color.text).toBe('#ff0000');
    const exported = await call('export_image', { imageId, name: 'cover' });
    expect(exported.text).toMatch(/as asset [0-9a-f-]{36}/);
    const listed = await call('list_images');
    expect(listed.text).toContain(imageId);
    const undone = await call('undo_image', { imageId });
    expect(undone.text).toBe('Undone');
  });

  it('edits a video, previews it and exports an mp4', async () => {
    const imported = await call('import_media', { path: testClip() });
    const clip = JSON.parse(imported.text) as {
      id: string;
      durationSeconds: number;
    };
    expect(clip).toMatchObject({
      kind: 'video',
      width: 320,
      height: 240,
      hasAudio: true,
    });
    expect(clip.durationSeconds).toBeCloseTo(3, 0);

    const cover = await call('create_image', {
      width: 160,
      height: 120,
      background: '#00ff00',
    });
    const coverAsset = idIn(
      (await call('export_image', { imageId: idIn(cover.text, 'imageId') }))
        .text,
      'asset',
    );

    const video = await call('create_video', {
      name: 'Trip',
      width: 320,
      height: 240,
    });
    const videoId = idIn(video.text, 'videoId');
    const edits = await call('batch_video', {
      videoId,
      calls: [
        {
          tool: 'add_clip',
          input: { assetId: clip.id, in: 0.5, out: 2.5, fadeIn: 0.5 },
        },
        {
          tool: 'add_clip',
          input: {
            assetId: coverAsset,
            layer: 1,
            start: 0,
            duration: 1,
            box: { x: 10, y: 10, width: 80, height: 60 },
          },
        },
        { tool: 'add_text', input: { text: 'Day one', start: 1, duration: 1 } },
      ],
    });
    expect(edits.isError).toBe(false);
    expect(edits.text).toContain('clip_3');

    const timeline = JSON.parse(
      (await call('get_video', { videoId })).text,
    ) as { durationSeconds: number; clipsByLayer: { id: string }[] };
    expect(timeline.durationSeconds).toBe(2);
    expect(timeline.clipsByLayer.map((c: { id: string }) => c.id)).toEqual([
      'clip_1',
      'clip_2',
      'clip_3',
    ]);

    const frame = await call('preview_frame', { videoId, time: 0.5 });
    expect(frame.isError).toBe(false);
    expect(frame.image).toMatchObject({ mimeType: 'image/png' });
    const strip = await call('preview_strip', { videoId, count: 4 });
    expect(strip.image).toBeDefined();

    const tooLong = await call('update_clip', {
      videoId,
      clipId: 'clip_1',
      out: 9,
    });
    expect(tooLong).toMatchObject({ isError: true });
    expect(tooLong.text).toContain('past the end');
    const noSuch = await call('update_clip', {
      videoId,
      clipId: 'clip_2',
      volume: 0.5,
    });
    expect(noSuch.text).toContain('has no volume');

    const started = await call('export_video', { videoId });
    const exportId = idIn(started.text, 'exportId');
    type ExportStatus = {
      status: string;
      asset: {
        durationSeconds: number;
        width: number;
        hasAudio: boolean;
      } | null;
      error: string | null;
    };
    let status: ExportStatus;
    for (;;) {
      const answer = await call('get_export', { exportId });
      status = JSON.parse(answer.text) as ExportStatus;
      if (status.status !== 'running') break;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    expect(status.error).toBeNull();
    expect(status.status).toBe('done');
    expect(status.asset).toMatchObject({ width: 320, hasAudio: true });
    expect(status.asset!.durationSeconds).toBeCloseTo(2, 0);

    expect((await call('undo_video', { videoId })).text).toBe('Undone');
    const empty = JSON.parse((await call('get_video', { videoId })).text) as {
      clipsByLayer: unknown[];
    };
    expect(empty.clipsByLayer).toEqual([]);
  }, 60_000);

  it('serves assets and read-only views for the UI', async () => {
    const assets = (await (await http.call('/assets')).json()) as {
      url: string;
    }[];
    expect(assets.length).toBeGreaterThan(0);
    const file = await fetch(
      assets[0].url.replace('http://localhost:4400', http.baseUrl),
    );
    expect(file.status).toBe(200);
    const images = (await (await http.call('/images')).json()) as {
      id: string;
    }[];
    const render = await http.call(`/images/${images[0].id}/render.png`);
    expect(render.headers.get('content-type')).toContain('image/png');
  });
});
