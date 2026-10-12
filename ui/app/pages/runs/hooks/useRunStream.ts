import { useEffect, useState } from "react";

import { streamRun } from "../api/run-stream";
import { isFinishedRun } from "../domain/status-tone";
import type { RunDetail } from "../domain/types";

const RETRY_MS = [1_000, 2_000, 5_000, 10_000];

/**
 * The run, live. Reconnects after drops; stops listening once the run is
 * finished. Bump `generation` (e.g. after Retry) to listen again.
 */
export const useRunStream = (runId: string | undefined, generation: number) => {
  const [run, setRun] = useState<RunDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) return;
    const controller = new AbortController();
    let failures = 0;

    const listen = async () => {
      while (!controller.signal.aborted) {
        try {
          await streamRun(
            runId,
            (next) => {
              failures = 0;
              setError(null);
              setRun(next);
              if (isFinishedRun(next.status)) controller.abort();
            },
            controller.signal,
          );
        } catch (streamError) {
          if (controller.signal.aborted) return;
          setError((streamError as Error).message);
        }
        const wait = RETRY_MS[Math.min(failures++, RETRY_MS.length - 1)];
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
    };
    void listen();
    return () => controller.abort();
  }, [runId, generation]);

  // A different run starts blank instead of showing the previous one.
  return { run: run?.id === runId ? run : null, error };
};
