import { useCallback, useEffect, useState } from "react";

import { startPreview } from "../api/video-api";
import type { VideoPreview } from "../domain/types";

const POLL_MS = 1000;

/**
 * The playable preview of the current timeline, rendered only once asked
 * (`request`). An edit makes it stale, so it's dropped until asked again.
 */
export const usePreviewVideo = (id: string, version: number) => {
  const [preview, setPreview] = useState<VideoPreview | null>(null);
  // Bumped by each request, so a failed render can be tried again.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setPreview(null);
    setAttempt(0);
  }, [id, version]);

  useEffect(() => {
    if (attempt === 0) return;
    let current = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const next = await startPreview(id);
        if (!current) return;
        setPreview(next);
        if (next.status === "running") timer = setTimeout(poll, POLL_MS);
      } catch (error) {
        if (current) setPreview(failed((error as Error).message));
      }
    };
    void poll();
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [id, version, attempt]);

  const request = useCallback(() => setAttempt((n) => n + 1), []);
  return { preview, request };
};

const failed = (error: string): VideoPreview => ({
  status: "failed",
  progress: 0,
  error,
  url: null,
});
