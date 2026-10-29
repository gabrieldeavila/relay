import { seconds } from './render-inputs.js';
import type { TextRun } from './text-runs.js';

/** ffmpeg input reading a run's ffconcat list (see textRunList). */
export const textRunInputArgs = (listPath: string) => [
  '-f',
  'concat',
  '-safe',
  '0',
  '-i',
  listPath,
];

/** Filters that move the run's frames to where it starts on the timeline. */
export const textRunChain = (run: TextRun) => [
  `setpts=PTS-STARTPTS+${seconds(run.start)}/TB`,
  'format=rgba',
];

/** Full-frame overlay while the run is on (text PNGs are full-frame). */
export function textRunOverlay(run: TextRun): string {
  const on = `gte(t,${seconds(run.start)})*lt(t,${seconds(run.end)})`;
  return `overlay=x=0:y=0:eof_action=pass:enable='${on}'`;
}
