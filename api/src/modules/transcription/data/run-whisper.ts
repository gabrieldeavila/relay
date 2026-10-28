import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { localPath } from '../../assets/data/local-path.js';
import type { WhisperJson } from '../domain/parse-whisper-json.js';
import type { TranscriptionConfig } from '../domain/transcription-config.js';

const run = promisify(execFile);

/**
 * Runs whisper-cli on a 16 kHz WAV and reads its full JSON (times per token).
 * Called directly instead of through nodejs-whisper, which changes the
 * process's working directory while it runs.
 */
export async function runWhisper(
  config: TranscriptionConfig,
  wavPath: string,
  language: string,
): Promise<WhisperJson> {
  const outBase = wavPath.replace(/\.wav$/, '');
  const args = [
    '-m',
    localPath(config.modelPath),
    '-f',
    wavPath,
    '-l',
    language,
    '-ojf',
    '-of',
    outBase,
    '-np',
  ];
  try {
    await run(localPath(config.cliPath), args, {
      maxBuffer: 50 * 1024 * 1024,
      timeout: 30 * 60_000,
    });
  } catch (error) {
    throw whisperError(error as NodeJS.ErrnoException & { stderr?: string });
  }
  return JSON.parse(await readFile(`${outBase}.json`, 'utf8')) as WhisperJson;
}

function whisperError(error: NodeJS.ErrnoException & { stderr?: string }) {
  if (error.code === 'ENOENT') {
    return new Error(
      'whisper-cli is not installed. Install whisper.cpp (e.g. `brew install whisper-cpp`) or set WHISPER_CLI_PATH.',
    );
  }
  const details = (error.stderr ?? error.message).trim().split('\n').slice(-5);
  return new Error(`whisper-cli failed: ${details.join(' | ')}`);
}
