import { stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { StepFailure } from '../../nodes/domain/step-failure.js';
import { expandHome, isUsablePath } from '../domain/expand-home.js';

/**
 * Full path of an existing local file a step was given, or a failure that
 * says what is wrong (retrying would not make the file appear).
 */
export async function requireLocalFile(
  path: string,
  maxBytes?: number,
): Promise<{ path: string; bytes: number }> {
  const full = expandHome(path, homedir());
  if (!isUsablePath(full)) {
    throw invalid(
      `Use the full path of the file, e.g. /Users/you/file.csv (got "${path}")`,
    );
  }
  const info = await stat(full).catch(() => null);
  if (!info?.isFile()) throw invalid(`File not found: ${full}`);
  if (maxBytes !== undefined && info.size > maxBytes) {
    throw invalid(`${full} is too big (${info.size} bytes, limit ${maxBytes})`);
  }
  return { path: full, bytes: info.size };
}

const invalid = (message: string) =>
  new StepFailure({ kind: 'invalid', message });
