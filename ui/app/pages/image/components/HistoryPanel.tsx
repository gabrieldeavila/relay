import { memo } from "react";
import { useTranslation } from "react-i18next";

import { relativeTime } from "@/app/format/relative-time";
import type { ImageEdit } from "../domain/types";
import { SidePanel } from "./SidePanel";

type HistoryPanelProps = { edits: ImageEdit[] };

/** Latest edits first, with who made them (Claude over MCP, or the app). */
export const HistoryPanel = memo(({ edits }: HistoryPanelProps) => {
  const { t, i18n } = useTranslation("image");
  const now = new Date();

  return (
    <SidePanel title={t("history")}>
      {edits.length === 0 ? (
        <p className="text-sm text-(--color-text-muted)">{t("noEdits")}</p>
      ) : (
        <ol className="flex flex-col gap-1">
          {[...edits].reverse().map((edit) => (
            <li
              key={edit.at}
              className="flex items-baseline justify-between gap-2 text-sm"
            >
              <span className="truncate">{edit.type}</span>
              <span className="shrink-0 text-xs text-(--color-text-muted)">
                {relativeTime(new Date(edit.at), now, i18n.language)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </SidePanel>
  );
});

HistoryPanel.displayName = "HistoryPanel";
