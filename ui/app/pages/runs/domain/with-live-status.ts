import type { RunDetail, RunSummary } from "./types";

/** The list refreshes every few seconds; the open run is live, so it wins. */
export function withLiveStatus(
  runs: RunSummary[],
  live: RunDetail | null,
): RunSummary[] {
  if (!live) return runs;
  return runs.map((run) =>
    run.id === live.id
      ? { ...run, status: live.status, finishedAt: live.finishedAt }
      : run,
  );
}
