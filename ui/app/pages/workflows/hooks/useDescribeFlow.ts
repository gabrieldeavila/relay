import { useState, type FormEvent } from "react";

import { ApiError } from "@/app/api/api-error";
import { draftWorkflow, type DraftedWorkflow } from "../api/builder-api";

/** "Describe what you want": the text, the draft Claude made, and why it failed. */
export const useDescribeFlow = (onDrafted: () => void) => {
  const [description, setDescription] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [draft, setDraft] = useState<DraftedWorkflow | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** 409: no Anthropic key yet, so point at Connections. */
  const [needsKey, setNeedsKey] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setDrafting(true);
    setError(null);
    setNeedsKey(false);
    try {
      setDraft(await draftWorkflow(description.trim()));
      setDescription("");
      onDrafted();
    } catch (draftError) {
      setNeedsKey(draftError instanceof ApiError && draftError.status === 409);
      setError((draftError as Error).message);
    } finally {
      setDrafting(false);
    }
  };

  return {
    description,
    setDescription,
    drafting,
    draft,
    error,
    needsKey,
    submit,
    clear: () => setDraft(null),
  };
};
