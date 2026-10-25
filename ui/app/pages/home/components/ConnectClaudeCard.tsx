import { memo } from "react";
import { useTranslation } from "react-i18next";

import { CopyField } from "@/app/components/CopyField";
import { mcpUrl } from "../api/studio-api";

/** How to give Claude (or any MCP client) Relay's tools. */
export const ConnectClaudeCard = memo(() => {
  const { t } = useTranslation("home");

  return (
    <section className="flex flex-col gap-3 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-4">
      <div>
        <h2 className="font-semibold">{t("connect.title")}</h2>
        <p className="text-sm text-(--color-text-muted)">
          {t("connect.description")}
        </p>
      </div>
      <CopyField
        label={t("connect.claudeCode")}
        value={`claude mcp add --transport http relay ${mcpUrl()}`}
      />
      <CopyField label={t("connect.address")} value={mcpUrl()} />
    </section>
  );
});

ConnectClaudeCard.displayName = "ConnectClaudeCard";
