import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { DocumentEngine } from '../../data/document-engine.js';
import { runTool } from './run-tool.js';
import { testPaintEnv, testServices } from './test-services.js';
import { findTool } from './tool-catalog.js';

async function setup() {
  const engine = new DocumentEngine(testPaintEnv);
  const call = (tool: string, input: unknown) =>
    runTool(findTool(tool)!, input, { engine, ...testServices, source: 'mcp' });
  await engine.reset(
    { width: 40, height: 20, background: 'transparent' },
    'rest',
  );
  await call('draw_rect', {
    rect: { x: 0, y: 0, width: 20, height: 20 },
    fill: '#ff0000',
  });
  return { call, dir: await mkdtemp(join(tmpdir(), 'relay-export-')) };
}

async function pixelAt(path: string, x: number, y: number) {
  const image = await loadImage(await readFile(path));
  const canvas = createCanvas(image.width, image.height);
  canvas.getContext('2d').drawImage(image, 0, 0);
  return {
    size: [image.width, image.height],
    rgba: [...canvas.getContext('2d').getImageData(x, y, 1, 1).data],
  };
}

describe('export_image tool', () => {
  it('saves a full-size PNG asset that keeps transparency', async () => {
    const { call } = await setup();
    const result = await call('export_image', { name: 'cover' });
    const asset = await testServices.assets.get(
      (result.data as { assetId: string }).assetId,
    );
    expect(asset).toMatchObject({
      name: 'cover.png',
      mimeType: 'image/png',
      source: 'export',
    });
    expect(await pixelAt(asset.path, 30, 10)).toEqual({
      size: [40, 20],
      rgba: [0, 0, 0, 0],
    });
    expect((await pixelAt(asset.path, 5, 5)).rgba).toEqual([255, 0, 0, 255]);
  });

  it('flattens JPEG onto the background color', async () => {
    const { call } = await setup();
    const result = await call('export_image', {
      format: 'jpg',
      background: '#0000ff',
      quality: 100,
    });
    const asset = await testServices.assets.get(
      (result.data as { assetId: string }).assetId,
    );
    const [r, g, b] = (await pixelAt(asset.path, 35, 10)).rgba;
    expect(r).toBeLessThan(10);
    expect(g).toBeLessThan(10);
    expect(b).toBeGreaterThan(245);
  });

  it('saves a copy to a path, refusing to overwrite unless asked', async () => {
    const { call, dir } = await setup();
    const path = join(dir, 'nested', 'out.png');
    await call('export_image', { path });
    expect((await pixelAt(path, 5, 5)).size).toEqual([40, 20]);
    const taken = join(dir, 'taken.png');
    await writeFile(taken, 'keep me');
    await expect(call('export_image', { path: taken })).rejects.toThrow(
      'already exists',
    );
    expect(await readFile(taken, 'utf8')).toBe('keep me');
    await call('export_image', { path: taken, overwrite: true });
    expect((await pixelAt(taken, 5, 5)).size).toEqual([40, 20]);
    await expect(
      call('export_image', { path: join(dir, 'x.sh') }),
    ).rejects.toThrow('must end in .png');
  });
});
