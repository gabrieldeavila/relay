import { useEffect, useState } from "react";

import { focusStep } from "../domain/focus-step";
import type { RunDetail } from "../domain/types";

/** Selected step; follows the step needing attention until the person picks one. */
export const useStepSelection = (run: RunDetail | null) => {
  const [picked, setPicked] = useState<string | null>(null);
  useEffect(() => setPicked(null), [run?.id]);
  const selectedId = picked ?? (run ? focusStep(run) : null);
  return { selectedId, select: setPicked };
};
