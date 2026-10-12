import ExcelJS from 'exceljs';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { StepFailure } from '../../nodes/domain/step-failure.js';
import { parseCsv } from '../domain/parse-csv.js';
import type { Cell } from '../domain/table-records.js';

const TEXT_TABLES = new Set(['.csv', '.tsv', '.txt']);

/** Cells of a CSV file or of one sheet of an Excel (.xlsx) file. */
export async function readTableFile(
  path: string,
  sheet?: string,
): Promise<Cell[][]> {
  const extension = extname(path).toLowerCase();
  if (TEXT_TABLES.has(extension)) return parseCsv(await readFile(path, 'utf8'));
  if (extension === '.xlsx') return readSheet(path, sheet);
  throw invalid(
    `Cannot read ${extension || 'this'} files: use .csv or .xlsx (in Excel or Numbers, "Save as" one of them)`,
  );
}

async function readSheet(path: string, sheet?: string): Promise<Cell[][]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path).catch((error: Error) => {
    throw invalid(`Could not open the spreadsheet: ${error.message}`);
  });
  const worksheet = sheet?.trim()
    ? workbook.getWorksheet(sheet.trim())
    : workbook.worksheets[0];
  if (!worksheet) {
    const names = workbook.worksheets.map((w) => w.name).join(', ');
    throw invalid(`Sheet "${sheet}" not found; this file has: ${names}`);
  }
  const grid: Cell[][] = [];
  worksheet.eachRow({ includeEmpty: true }, (row) => {
    const values = Array.isArray(row.values) ? row.values.slice(1) : [];
    grid.push(Array.from(values, cellValue));
  });
  return grid;
}

/** Excel cells hold formulas, links and rich text; steps get plain values. */
function cellValue(value: ExcelJS.CellValue | undefined): Cell {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== 'object') return value;
  if ('result' in value) return cellValue(value.result);
  if ('richText' in value) return value.richText.map((r) => r.text).join('');
  if ('text' in value) return String(value.text);
  if ('error' in value) return null;
  return null;
}

const invalid = (message: string) =>
  new StepFailure({ kind: 'invalid', message });
