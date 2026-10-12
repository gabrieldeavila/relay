import { sql } from 'drizzle-orm';
import ExcelJS from 'exceljs';
import { mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FolderPoller } from '../src/modules/triggers/data/folder-poller';
import { edge, EngineHarness, node } from './support/engine-harness';

/** Written a minute ago, so the file counts as finished. */
function writeSettled(path: string, content: string, minutesAgo = 1) {
  writeFileSync(path, content);
  const when = new Date(Date.now() - minutesAgo * 60_000);
  utimesSync(path, when, when);
}

describe('local building blocks', () => {
  let engine: EngineHarness;
  let dir: string;

  beforeAll(async () => {
    engine = await EngineHarness.create();
  });
  afterAll(() => engine.close());
  beforeEach(async () => {
    await engine.reset();
    dir = mkdtempSync(join(tmpdir(), 'relay-folder-'));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  describe('folder trigger', () => {
    const scan = () => engine.get(FolderPoller).scan();
    const publishWatch = (pattern = '*.csv', workflowId?: string) =>
      engine.publish(
        {
          nodes: [
            node('start', 'trigger.folder', { folder: dir, pattern }),
            node('note', 'data.set', {
              fields: { file: '{{ trigger.name }}' },
            }),
          ],
          edges: [edge('start', 'note')],
        },
        workflowId,
      );
    const runCount = async (workflowId: string) => {
      const [row] = await engine.db.execute<{ count: number }>(
        sql`SELECT count(*)::int AS count FROM relay.runs WHERE workflow_id = ${workflowId}`,
      );
      return row.count;
    };

    it('starts one run per new file, never for files already there', async () => {
      writeSettled(join(dir, 'old.csv'), 'a');
      const workflowId = await publishWatch();
      expect(await scan()).toBe(0);

      writeSettled(join(dir, 'new.csv'), 'b');
      writeSettled(join(dir, 'skip.txt'), 'c');
      expect(await scan()).toBe(1);
      expect(await scan()).toBe(0);
      await engine.worker.drain();

      const trigger = await engine.describeTrigger(workflowId);
      expect(trigger).toMatchObject({
        kind: 'folder',
        folder: dir,
        exists: true,
      });
      expect(await runCount(workflowId)).toBe(1);
    });

    it('hands the file to the next steps', async () => {
      await publishWatch();
      writeSettled(join(dir, 'sales.csv'), 'x');
      await scan();
      await engine.worker.drain();

      const [run] = await engine.db.execute<{ id: string }>(
        sql`SELECT id FROM relay.runs ORDER BY created_at DESC LIMIT 1`,
      );
      const view = await engine.run(run.id);
      expect(view.status).toBe('succeeded');
      expect(
        view.steps.find((s) => s.nodeId === 'start')?.output,
      ).toMatchObject({
        name: 'sales.csv',
        path: join(dir, 'sales.csv'),
        folder: dir,
        bytes: 1,
      });
      expect(view.steps.find((s) => s.nodeId === 'note')?.output).toEqual({
        file: 'sales.csv',
      });
    });

    it('waits for a file still being written, and runs again when it changes', async () => {
      await publishWatch();
      writeFileSync(join(dir, 'copying.csv'), 'partial');
      expect(await scan()).toBe(0);

      writeSettled(join(dir, 'copying.csv'), 'done', 2);
      expect(await scan()).toBe(1);
      writeSettled(join(dir, 'copying.csv'), 'edited', 1);
      expect(await scan()).toBe(1);
    });

    it('keeps what it saw across republishing, and starts over for a new pattern', async () => {
      const workflowId = await publishWatch('*.csv');
      writeSettled(join(dir, 'a.csv'), 'a');
      expect(await scan()).toBe(1);

      await publishWatch('*.csv', workflowId);
      expect(await scan()).toBe(0);

      writeSettled(join(dir, 'b.txt'), 'b');
      await publishWatch('*.txt', workflowId);
      expect(await scan()).toBe(0);
    });

    it('says when the folder does not exist', async () => {
      const workflowId = await engine.publish({
        nodes: [node('start', 'trigger.folder', { folder: join(dir, 'nope') })],
        edges: [],
      });
      expect(await scan()).toBe(0);
      expect(await engine.describeTrigger(workflowId)).toMatchObject({
        exists: false,
      });
    });

    it('refuses to publish a folder that is not a full path', async () => {
      const result = await engine.tryPublish({
        nodes: [node('start', 'trigger.folder', { folder: 'Downloads' })],
        edges: [],
      });
      expect(result).toMatchObject({
        type: 'invalid',
        issues: [{ code: 'invalid_config', nodeId: 'start', field: 'folder' }],
      });
    });
  });

  describe('read a spreadsheet', () => {
    const readWith = async (config: Record<string, unknown>) => {
      const workflowId = await engine.publish({
        nodes: [
          node('start', 'trigger.manual'),
          node('sheet', 'file.read_table', config),
        ],
        edges: [edge('start', 'sheet')],
      });
      const runId = await engine.start(workflowId);
      await engine.worker.drain();
      const run = await engine.run(runId);
      return run.steps.find((step) => step.nodeId === 'sheet')!;
    };

    it('reads CSV rows by column name and picks one', async () => {
      const path = join(dir, 'quotes.csv');
      writeFileSync(path, 'quote;author\n"Keep going; always";Ana\nRest;Bia\n');
      const step = await readWith({ path, pick: 'last' });
      expect(step.status).toBe('succeeded');
      expect(step.output).toEqual({
        rows: [
          { quote: 'Keep going; always', author: 'Ana' },
          { quote: 'Rest', author: 'Bia' },
        ],
        count: 2,
        columns: ['quote', 'author'],
        row: { quote: 'Rest', author: 'Bia' },
        truncated: false,
      });
    });

    it('reads a sheet of an Excel file, with formulas as their values', async () => {
      const workbook = new ExcelJS.Workbook();
      workbook.addWorksheet('Notes').addRow(['ignored']);
      const sheet = workbook.addWorksheet('Sales');
      sheet.addRow(['item', 'price', 'day']);
      sheet.addRow(['Coffee', 3.5, new Date('2026-10-12T00:00:00Z')]);
      sheet.addRow(['Total', { formula: 'B2*2', result: 7 }]);
      const path = join(dir, 'sales.xlsx');
      await workbook.xlsx.writeFile(path);

      const step = await readWith({ path, sheet: 'Sales' });
      expect(step.status).toBe('succeeded');
      expect((step.output as { rows: unknown[] }).rows).toEqual([
        { item: 'Coffee', price: 3.5, day: '2026-10-12T00:00:00.000Z' },
        { item: 'Total', price: 7, day: null },
      ]);
    });

    it('fails at once, saying why, for a missing file or an unknown sheet', async () => {
      const missing = await readWith({ path: join(dir, 'nope.csv') });
      expect(missing.status).toBe('failed');
      expect(missing.attempts).toHaveLength(1);
      expect(missing.error).toMatchObject({ kind: 'invalid' });
      expect(missing.error?.message).toContain('File not found');

      const workbook = new ExcelJS.Workbook();
      workbook.addWorksheet('Only');
      const path = join(dir, 'one.xlsx');
      await workbook.xlsx.writeFile(path);
      const sheet = await readWith({ path, sheet: 'Other' });
      expect(sheet.error).toMatchObject({
        message: 'Sheet "Other" not found; this file has: Only',
      });
    });
  });
});
