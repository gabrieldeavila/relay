import { memo } from "react";
import { useTranslation } from "react-i18next";
import { FiKey } from "react-icons/fi";

import { Alert } from "@/ui/components/primitives/alert";
import { Button } from "@/ui/components/primitives/button";
import { Spinner } from "@/ui/components/primitives/spinner";
import { useAccessTokens } from "../hooks/useAccessTokens";
import { AccessTokenRow } from "./AccessTokenRow";
import { NewTokenNotice } from "./NewTokenNotice";

/** "Use Relay from Claude": tokens that let MCP clients build and run flows. */
export const McpAccessSection = memo(() => {
  const { t } = useTranslation("connections");
  const tokens = useAccessTokens();

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h2 className="text-xl font-semibold">{t("mcp.title")}</h2>
        <p className="text-(--color-text-muted)">{t("mcp.subtitle")}</p>
      </header>
      {tokens.error && <Alert variant="danger">{tokens.error}</Alert>}
      {!tokens.data ? (
        !tokens.error && <Spinner />
      ) : (
        <>
          {tokens.created ? (
            <NewTokenNotice
              mcpUrl={tokens.data.mcpUrl}
              token={tokens.created}
              onDone={tokens.dismissCreated}
            />
          ) : (
            <div>
              <Button
                isLoading={tokens.busy}
                leftIcon={<FiKey aria-hidden="true" />}
                onClick={() => void tokens.create("Claude")}
              >
                {t("mcp.create")}
              </Button>
            </div>
          )}
          {tokens.data.tokens.length > 0 && (
            <ul className="flex flex-col gap-2">
              {tokens.data.tokens.map((token) => (
                <AccessTokenRow
                  key={token.id}
                  token={token}
                  busy={tokens.busy}
                  onRevoke={() => void tokens.revoke(token.id)}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
});

McpAccessSection.displayName = "McpAccessSection";
