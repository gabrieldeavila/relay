import { z } from 'zod';
import { requireLocalFile } from '../../files/data/local-file.js';
import { readTableFile } from '../../files/data/read-table-file.js';
import { pickRow, ROW_PICKS } from '../../files/domain/pick-row.js';
import { tableRecords } from '../../files/domain/table-records.js';
import { defineNode } from '../domain/node-definition.js';
import { done } from '../domain/node-result.js';

const MAX_FILE_BYTES = 20 * 1024 * 1024;
/** Rows kept in the step's output (it is stored with the run). */
const MAX_ROWS = 5_000;

/** Output: `{ rows, count, columns, row, truncated }`; `row` is the picked one. */
export const readTableNode = defineNode({
  type: 'file.read_table',
  kind: 'action',
  title: 'Read a spreadsheet',
  description: 'Reads the rows of a CSV or Excel file on this computer.',
  config: z.object({
    path: z.string().min(1),
    pick: z.enum(ROW_PICKS).default('first'),
    sheet: z.string().optional(),
  }),
  outputPorts: ['out', 'error'],
  timeoutMs: 60_000,
  async run({ path, pick, sheet }, ctx) {
    const file = await requireLocalFile(path, MAX_FILE_BYTES);
    const table = tableRecords(await readTableFile(file.path, sheet), MAX_ROWS);
    return done({
      rows: table.rows,
      count: table.rows.length,
      columns: table.columns,
      row: pickRow(table.rows, pick, ctx.now()),
      truncated: table.truncated,
    });
  },
});
