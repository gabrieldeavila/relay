import { SerialPerKey } from './serial-per-key.js';
import { parseToolCatalog } from './tool-catalog.js';
import {
  parseToolNodeType,
  toolNodeType,
  toolTitle,
} from './tool-node-type.js';

describe('parseToolCatalog', () => {
  it('reads the Claude tool format', () => {
    expect(
      parseToolCatalog([
        { name: 'draw_text', input_schema: { type: 'object', properties: {} } },
      ]),
    ).toEqual([
      {
        name: 'draw_text',
        description: '',
        input_schema: { type: 'object', properties: {} },
      },
    ]);
  });

  it('explains what is wrong with anything else', () => {
    expect(() => parseToolCatalog({ tools: [] })).toThrow(/Not a tool list/);
    expect(() =>
      parseToolCatalog([{ name: 'bad name!', input_schema: {} }]),
    ).toThrow(/Tool names/);
  });
});

describe('tool node types', () => {
  it('round-trips provider and tool', () => {
    const type = toolNodeType('p1', 'draw_text');
    expect(type).toBe('tool:p1:draw_text');
    expect(parseToolNodeType(type)).toEqual({
      providerId: 'p1',
      toolName: 'draw_text',
    });
  });

  it('ignores built-in types and malformed ones', () => {
    expect(parseToolNodeType('http.request')).toBeNull();
    expect(parseToolNodeType('tool:p1')).toBeNull();
    expect(parseToolNodeType('tool:p1:a:b')).toBeNull();
  });

  it('titles tools in plain words', () => {
    expect(toolTitle('draw_text')).toBe('Draw text');
    expect(toolTitle('openImage')).toBe('Open image');
    expect(toolTitle('render-PNG')).toBe('Render png');
  });
});

describe('SerialPerKey', () => {
  const tick = () => new Promise((resolve) => setTimeout(resolve, 5));

  it('never overlaps tasks with the same key, even when one fails', async () => {
    const queue = new SerialPerKey();
    const log: string[] = [];
    const task =
      (name: string, fail = false) =>
      async () => {
        log.push(`start ${name}`);
        await tick();
        log.push(`end ${name}`);
        if (fail) throw new Error(name);
        return name;
      };
    const results = await Promise.allSettled([
      queue.run('pincel', task('a', true)),
      queue.run('pincel', task('b')),
      queue.run('other', task('c')),
    ]);
    expect(results.map((r) => r.status)).toEqual([
      'rejected',
      'fulfilled',
      'fulfilled',
    ]);
    expect(log.indexOf('end a')).toBeLessThan(log.indexOf('start b'));
    expect(log.indexOf('start c')).toBeLessThan(log.indexOf('end a'));
  });
});
