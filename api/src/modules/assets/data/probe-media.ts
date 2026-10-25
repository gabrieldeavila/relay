import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  parseProbe,
  type FfprobeOutput,
  type MediaInfo,
} from '../domain/parse-probe.js';
import { ffprobePath } from './media-binaries.js';

const run = promisify(execFile);

/** Size, duration and streams of a media file, read with ffprobe. */
export async function probeMedia(
  path: string,
  isStill: boolean,
): Promise<MediaInfo> {
  try {
    const { stdout } = await run(
      ffprobePath(),
      [
        '-v',
        'error',
        '-print_format',
        'json',
        '-show_streams',
        '-show_format',
        path,
      ],
      { maxBuffer: 10 * 1024 * 1024 },
    );
    return parseProbe(JSON.parse(stdout) as FfprobeOutput, isStill);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(
        'ffprobe is not installed. Install ffmpeg (e.g. `brew install ffmpeg`).',
      );
    }
    throw new Error(`Could not read this media file: ${path}`);
  }
}
