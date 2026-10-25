import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import { DocumentEngine } from '../../data/document-engine.js';
import { sampleColor } from '../../data/document-renderer.js';
import { runTool } from './run-tool.js';
import { testPaintEnv, testServices } from './test-services.js';
import { findTool } from './tool-catalog.js';

async function photoOnDisk(width: number, height: number) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#336699';
  ctx.fillRect(0, 0, width, height);
  const path = join(await mkdtemp(join(tmpdir(), 'relay-')), 'photo.png');
  await writeFile(path, canvas.toBuffer('image/png'));
  return path;
}

describe('place_image tool', () => {
  async function setup() {
    const engine = new DocumentEngine(testPaintEnv);
    await engine.reset(
      { width: 100, height: 100, background: '#ffffff' },
      'rest',
    );
    const call = (tool: string, input: unknown) =>
      runTool(findTool(tool)!, input, {
        engine,
        ...testServices,
        source: 'mcp',
      });
    return { engine, call };
  }

  it('imports a local file as an asset and stores only its reference', async () => {
    const { engine, call } = await setup();
    await call('place_image', {
      path: await photoOnDisk(20, 10),
      x: 10,
      y: 10,
    });
    expect(sampleColor(engine.doc, 15, 15)).toBe('#336699');
    expect(sampleColor(engine.doc, 50, 50)).toBe('#ffffff');
    const [placed] = engine.log.flatMap((entry) => entry.commands);
    expect(placed.type === 'place_image' && placed.src).toMatch(/^asset:/);
  });

  it('places an existing asset again and replays it after undo/redo', async () => {
    const { engine, call } = await setup();
    const asset = await testServices.assets.importPath(
      await photoOnDisk(20, 20),
    );
    await call('place_image', { assetId: asset.id, x: 50, y: 50 });
    await engine.undo();
    await engine.redo();
    expect(sampleColor(engine.doc, 55, 55)).toBe('#336699');
  });

  it('asks for exactly one source and refuses non-images', async () => {
    const { call } = await setup();
    await expect(call('place_image', {})).rejects.toThrow(
      'exactly one of assetId, path or url',
    );
    await expect(call('place_image', { path: '/etc/hosts' })).rejects.toThrow(
      'Unsupported file type',
    );
  });
});
