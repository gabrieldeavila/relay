import { memo } from "react";
import { useTranslation } from "react-i18next";
import { FiTrash2 } from "react-icons/fi";

import { relativeTime } from "@/app/format/relative-time";
import { Button } from "@/ui/components/primitives/button";
import type { AccessToken } from "../api/access-tokens-api";

type AccessTokenRowProps = {
  token: AccessToken;
  busy: boolean;
  onRevoke: () => void;
};

export const AccessTokenRow = memo(
  ({ token, busy, onRevoke }: AccessTokenRowProps) => {
    const { t, i18n } = useTranslation("connections");
    const when = (date: string) =>
      relativeTime(new Date(date), new Date(), i18n.language);

    return (
      <li className="flex flex-wrap items-center gap-3 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{token.name}</p>
          <p className="text-sm text-(--color-text-muted)">
            <span className="font-mono">{token.hint}</span> ·{" "}
            {token.lastUsedAt
              ? t("mcp.used", { when: when(token.lastUsedAt) })
              : t("mcp.neverUsed")}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          leftIcon={<FiTrash2 aria-hidden="true" />}
          onClick={onRevoke}
        >
          {t("mcp.revoke")}
        </Button>
      </li>
    );
  },
);

AccessTokenRow.displayName = "AccessTokenRow";
