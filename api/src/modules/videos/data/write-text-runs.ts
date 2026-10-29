import { createCanvas } from '@napi-rs/canvas';
import { writeFile } from 'node:fs/promises';
import { textRunList } from '../domain/text-run-list.js';
import type { RenderItem, TextRun } from '../domain/text-runs.js';
import type { VideoSetup } from '../domain/timeline-types.js';

/**
 * Writes an ffconcat list for each text run (plus the transparent frame they
 * share for gaps) and returns the list paths by run id.
 */
export async function writeTextRuns(
  items: RenderItem[],
  textImages: Record<string, string>,
  setup: VideoSetup,
  fileIn: (name: string) => string,
): Promise<Record<string, string>> {
  const runs = items.filter((item): item is TextRun => item.kind === 'textRun');
  if (runs.length === 0) return {};
  const blank = fileIn('text-blank.png');
  await writeFile(blank, blankFrame(setup));
  const lists: Record<string, string> = {};
  for (const run of runs) {
    const path = fileIn(`run-${run.id}.ffconcat`);
    await writeFile(path, textRunList(run, textImages, blank));
    lists[run.id] = path;
  }
  return lists;
}

/** Same size and pixel format as the text PNGs, so the demuxer can mix them. */
function blankFrame(setup: VideoSetup): Buffer {
  return createCanvas(setup.width, setup.height).toBuffer('image/png');
}
