import { memo } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/ui/helpers/cn";
import type { SaveState } from "../hooks/useWorkflowDraft";

export const SaveStatus = memo(({ state }: { state: SaveState }) => {
  const { t } = useTranslation("editor");
  return (
    <span
      role="status"
      className={cn(
        "text-xs",
        state === "error" ? "text-(--color-danger)" : "text-(--color-text-muted)",
      )}
    >
      {t(`save.${state}`)}
    </span>
  );
});

SaveStatus.displayName = "SaveStatus";
