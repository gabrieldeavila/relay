import { memo } from "react";
import { useTranslation } from "react-i18next";

import { Alert } from "@/ui/components/primitives/alert";
import type { TriggerInfo } from "../api/editor-api";

type FolderTriggerInfoProps = {
  trigger: Extract<TriggerInfo, { kind: "folder" }>;
};

/** The watched folder, with a warning when it does not exist (it would never fire). */
export const FolderTriggerInfo = memo(({ trigger }: FolderTriggerInfoProps) => {
  const { t } = useTranslation("editor");
  return (
    <>
      <p className="text-sm text-(--color-text-muted)">{t("trigger.folder")}</p>
      <code className="break-all rounded-(--radius-sm) bg-(--color-surface-2) p-2 font-mono text-xs">
        {trigger.folder}
        {trigger.pattern !== "*" && ` (${trigger.pattern})`}
      </code>
      {!trigger.exists && (
        <Alert variant="warning">{t("trigger.folderMissing")}</Alert>
      )}
    </>
  );
});

FolderTriggerInfo.displayName = "FolderTriggerInfo";
