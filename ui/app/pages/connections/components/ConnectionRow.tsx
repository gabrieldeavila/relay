import { memo } from "react";
import { useTranslation } from "react-i18next";
import { FiRefreshCw, FiTrash2 } from "react-icons/fi";

import { Button } from "@/ui/components/primitives/button";
import { relativeTime } from "@/app/format/relative-time";
import type { Connection } from "../api/connections-api";

type ConnectionRowProps = {
  connection: Connection;
  busy: boolean;
  onRefresh: () => void;
  onRemove: () => void;
};

export const ConnectionRow = memo(
  ({ connection, busy, onRefresh, onRemove }: ConnectionRowProps) => {
    const { t, i18n } = useTranslation("connections");
    const refreshed = relativeTime(
      new Date(connection.refreshedAt),
      new Date(),
      i18n.language,
    );

    return (
      <li className="flex flex-wrap items-center gap-3 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{connection.name}</p>
          <p className="truncate font-mono text-xs text-(--color-text-muted)">
            {connection.baseUrl}
          </p>
          <p className="text-sm text-(--color-text-muted)">
            {t("row.tools", { count: connection.toolCount })} ·{" "}
            {t("row.refreshed", { when: refreshed })}
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          isLoading={busy}
          leftIcon={<FiRefreshCw aria-hidden="true" />}
          onClick={onRefresh}
        >
          {t("row.refresh")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          leftIcon={<FiTrash2 aria-hidden="true" />}
          onClick={onRemove}
        >
          {t("row.remove")}
        </Button>
      </li>
    );
  },
);

ConnectionRow.displayName = "ConnectionRow";
