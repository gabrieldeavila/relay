import { spawn } from 'node:child_process';
import { ffmpegPath } from '../../assets/data/media-binaries.js';

export interface FfmpegRun {
  /** Seconds of output to expect, to report progress 0..1. */
  totalSeconds?: number;
  onProgress?: (progress: number) => void;
  timeoutMs?: number;
}

/** Runs ffmpeg; rejects with its last error lines when it fails. */
export function runFfmpeg(args: string[], run: FfmpegRun = {}): Promise<void> {
  const withProgress = run.onProgress
    ? ['-progress', 'pipe:1', '-nostats', ...args]
    : args;
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath(), withProgress, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let errors = '';
    child.stderr.on('data', (chunk: Buffer) => {
      errors = (errors + chunk.toString()).slice(-4000);
    });
    child.stdout.on('data', (chunk: Buffer) => report(chunk, run));
    const timer = run.timeoutMs
      ? setTimeout(() => child.kill('SIGKILL'), run.timeoutMs)
      : undefined;
    child.on('error', (error: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      reject(
        error.code === 'ENOENT'
          ? new Error(
              'ffmpeg is not installed. Install it (e.g. `brew install ffmpeg`).',
            )
          : error,
      );
    });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      if (code === 0) return resolve();
      const why = signal ? `stopped (${signal})` : `failed (exit ${code})`;
      reject(
        new Error(
          `ffmpeg ${why}: ${errors.trim().split('\n').slice(-5).join(' | ')}`,
        ),
      );
    });
  });
}

/** `-progress` prints `out_time_us=<microseconds>` lines as it renders. */
function report(chunk: Buffer, run: FfmpegRun) {
  if (!run.onProgress || !run.totalSeconds) return;
  const matches = [...chunk.toString().matchAll(/out_time_us=(\d+)/g)];
  const last = matches.at(-1);
  if (!last) return;
  const done = Number(last[1]) / 1_000_000 / run.totalSeconds;
  run.onProgress(Math.max(0, Math.min(1, done)));
}
