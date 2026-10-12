import { useCallback, useEffect, useState } from "react";

import { fetchTrigger, type TriggerInfo } from "../api/editor-api";

/** How the published version starts (webhook URL, next scheduled fire). */
export const useTrigger = (id: string) => {
  const [trigger, setTrigger] = useState<TriggerInfo | null>(null);

  const reload = useCallback(() => {
    fetchTrigger(id).then(setTrigger, () => setTrigger(null));
  }, [id]);

  useEffect(reload, [reload]);
  return { trigger, reload };
};
