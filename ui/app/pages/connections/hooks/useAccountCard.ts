import { useState, type FormEvent } from "react";

import type { AccountKind } from "../api/accounts-api";
import type { AccountsState } from "./useAccounts";

/** Save, test and remove for one account card; errors come back as text. */
export const useAccountCard = (kind: AccountKind, accounts: AccountsState) => {
  const [busy, setBusy] = useState<"save" | "test" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (
    what: "save" | "test" | "remove",
    action: () => Promise<void>,
  ) => {
    setBusy(what);
    setError(null);
    try {
      await action();
    } catch (actionError) {
      setError((actionError as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return {
    saved: accounts.find(kind),
    check: accounts.checks[kind],
    busy,
    error,
    /** Saves, then tests right away so people see at once whether it works. */
    submit: (
      event: FormEvent,
      settings: Record<string, unknown>,
      secret?: string,
    ) => {
      event.preventDefault();
      return run("save", async () => {
        await accounts.save(kind, settings, secret);
        await accounts.check(kind);
      });
    },
    /** Changes settings only, keeping the stored secret (e.g. the picked chat). */
    update: (settings: Record<string, unknown>) =>
      run("save", () => accounts.save(kind, settings)),
    test: () => run("test", () => accounts.check(kind)),
    remove: () => run("remove", () => accounts.remove(kind)),
  };
};

export type AccountCardState = ReturnType<typeof useAccountCard>;
