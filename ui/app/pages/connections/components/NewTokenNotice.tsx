import { memo } from "react";
import { useTranslation } from "react-i18next";

import { Alert } from "@/ui/components/primitives/alert";
import { Button } from "@/ui/components/primitives/button";
import { authorizationHeader, claudeCodeCommand } from "../domain/mcp-setup";
import { CopyField } from "./CopyField";

type NewTokenNoticeProps = {
  mcpUrl: string;
  token: string;
  onDone: () => void;
};

/** The only time a token is visible: ready-to-paste setup for Claude. */
export const NewTokenNotice = memo(
  ({ mcpUrl, token, onDone }: NewTokenNoticeProps) => {
    const { t } = useTranslation("connections");

    return (
      <div className="flex flex-col gap-3 rounded-(--radius-md) border border-(--color-border) p-4">
        <Alert variant="warning">{t("mcp.onlyOnce")}</Alert>
        <CopyField
          label={t("mcp.claudeCode")}
          value={claudeCodeCommand(mcpUrl, token)}
        />
        <CopyField label={t("mcp.address")} value={mcpUrl} />
        <CopyField label={t("mcp.header")} value={authorizationHeader(token)} />
        <div>
          <Button size="sm" variant="secondary" onClick={onDone}>
            {t("mcp.done")}
          </Button>
        </div>
      </div>
    );
  },
);

NewTokenNotice.displayName = "NewTokenNotice";
