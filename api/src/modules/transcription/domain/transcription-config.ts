/** Local whisper.cpp setup. */
export interface TranscriptionConfig {
  /** The whisper.cpp command-line binary. */
  cliPath: string;
  /** A ggml model file, e.g. ggml-small.bin. */
  modelPath: string;
  /** Spoken language code ("pt", "en") or "auto" to detect it. */
  language: string;
}

/**
 * Reads WHISPER_MODEL_PATH (required to turn transcription on),
 * WHISPER_CLI_PATH and WHISPER_LANGUAGE; null when not set up.
 */
export function readTranscriptionConfig(
  env: Record<string, string | undefined>,
): TranscriptionConfig | null {
  const modelPath = env.WHISPER_MODEL_PATH?.trim();
  if (!modelPath) return null;
  return {
    cliPath: env.WHISPER_CLI_PATH?.trim() || 'whisper-cli',
    modelPath,
    language: env.WHISPER_LANGUAGE?.trim().toLowerCase() || 'auto',
  };
}
