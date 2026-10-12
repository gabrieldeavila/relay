import { useCallback, useEffect, useRef, useState } from "react";

import { fetchWorkflow, saveWorkflow, type Workflow } from "../api/editor-api";
import type { WorkflowGraph } from "../domain/types";

export type SaveState = "saved" | "unsaved" | "saving" | "error";

type DraftChanges = { name?: string; draftGraph?: WorkflowGraph };

const AUTOSAVE_MS = 700;

/** The draft being edited, saved automatically shortly after each change. */
export const useWorkflowDraft = (id: string) => {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  // Latest state for handlers that run between renders (drags, autosave).
  const latest = useRef<Workflow | null>(null);
  const pending = useRef<DraftChanges>({});
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const replace = useCallback((next: Workflow) => {
    latest.current = next;
    setWorkflow(next);
  }, []);

  useEffect(() => {
    fetchWorkflow(id).then(replace, (error: Error) => setLoadError(error.message));
  }, [id, replace]);

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    const changes = pending.current;
    if (!Object.keys(changes).length) return;
    pending.current = {};
    setSaveState("saving");
    try {
      await saveWorkflow(id, changes);
      setSaveState(Object.keys(pending.current).length ? "unsaved" : "saved");
    } catch {
      pending.current = { ...changes, ...pending.current };
      setSaveState("error");
    }
  }, [id]);

  const change = useCallback(
    (changes: DraftChanges) => {
      if (!latest.current) return;
      replace({ ...latest.current, ...changes });
      pending.current = { ...pending.current, ...changes };
      setSaveState("unsaved");
      clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), AUTOSAVE_MS);
    },
    [flush, replace],
  );

  const setGraph = useCallback(
    (update: (graph: WorkflowGraph) => WorkflowGraph) => {
      const current = latest.current?.draftGraph;
      if (!current) return;
      const next = update(current);
      if (next !== current) change({ draftGraph: next });
    },
    [change],
  );

  const markPublished = useCallback(
    (version: number) => {
      if (latest.current) replace({ ...latest.current, latestVersion: version });
    },
    [replace],
  );

  // Leaving the page saves what is still pending.
  useEffect(() => () => void flush(), [flush]);

  return {
    workflow,
    loadError,
    saveState,
    setGraph,
    // An empty name is shown while typing but never saved (the API refuses it).
    rename: (name: string) =>
      name.trim()
        ? change({ name })
        : latest.current && replace({ ...latest.current, name }),
    markPublished,
    flush,
  };
};
