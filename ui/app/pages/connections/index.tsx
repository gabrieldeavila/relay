import { memo } from "react";
import { useTranslation } from "react-i18next";
import { FiArrowLeft } from "react-icons/fi";
import { Link } from "react-router";

import { Alert } from "@/ui/components/primitives/alert";
import { Spinner } from "@/ui/components/primitives/spinner";
import { AccountsSection } from "./components/AccountsSection";
import { AddConnectionForm } from "./components/AddConnectionForm";
import { ConnectionRow } from "./components/ConnectionRow";
import { McpAccessSection } from "./components/McpAccessSection";
import { useConnections } from "./hooks/useConnections";

export function meta() {
  return [{ title: "Relay" }];
}

const Connections = memo(() => {
  const { t } = useTranslation("connections");
  const connections = useConnections();

  return (
    <main className="min-h-[100dvh] bg-(--color-bg) text-(--color-text)">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-(--color-text-muted) hover:text-(--color-text)"
        >
          <FiArrowLeft aria-hidden="true" />
          {t("back")}
        </Link>
        <header>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-(--color-text-muted)">{t("subtitle")}</p>
        </header>
        <AddConnectionForm onAdd={connections.add} />
        {connections.error && (
          <Alert variant="danger">{connections.error}</Alert>
        )}
        {!connections.connections ? (
          <Spinner />
        ) : connections.connections.length === 0 ? (
          <p className="text-(--color-text-muted)">{t("empty")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {connections.connections.map((connection) => (
              <ConnectionRow
                key={connection.id}
                connection={connection}
                busy={connections.busyId === connection.id}
                onRefresh={() => void connections.refresh(connection.id)}
                onRemove={() => void connections.remove(connection.id)}
              />
            ))}
          </ul>
        )}
        <AccountsSection />
        <McpAccessSection />
      </div>
    </main>
  );
});

Connections.displayName = "Connections";

export default Connections;
