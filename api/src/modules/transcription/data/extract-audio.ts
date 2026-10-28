import { runFfmpeg } from '../../videos/data/ffmpeg-runner.js';

/** The 16 kHz mono WAV that whisper.cpp reads, from any audio or video file. */
export function extractAudio(source: string, wavPath: string): Promise<void> {
  return runFfmpeg(
    [
      '-nostats',
      '-loglevel',
      'error',
      '-y',
      '-i',
      source,
      '-vn',
      '-ar',
      '16000',
      '-ac',
      '1',
      '-c:a',
      'pcm_s16le',
      wavPath,
    ],
    { timeoutMs: 10 * 60_000 },
  );
}
