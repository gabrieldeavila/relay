import { useCallback, useEffect, useState } from "react";

import {
  checkAccount,
  listAccounts,
  removeAccount,
  saveAccount,
  type Account,
  type AccountCheck,
  type AccountKind,
} from "../api/accounts-api";

/** The user's email, Telegram and AI accounts and the result of the last check of each. */
export const useAccounts = () => {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [checks, setChecks] = useState<
    Partial<Record<AccountKind, AccountCheck>>
  >({});
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setAccounts(await listAccounts());
    } catch (loadError) {
      setError((loadError as Error).message);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const forget = (kind: AccountKind) =>
    setChecks(({ [kind]: _dropped, ...rest }) => rest);

  return {
    accounts,
    error,
    checks,
    find: (kind: AccountKind) => accounts?.find((a) => a.kind === kind),
    /** Throws so the card can show the problem next to its fields. */
    save: async (
      kind: AccountKind,
      settings: Record<string, unknown>,
      secret?: string,
    ) => {
      await saveAccount(kind, settings, secret);
      forget(kind);
      await reload();
    },
    remove: async (kind: AccountKind) => {
      await removeAccount(kind);
      forget(kind);
      await reload();
    },
    check: async (kind: AccountKind) => {
      const result = await checkAccount(kind).catch(
        (checkError: Error): AccountCheck => ({
          ok: false,
          message: checkError.message,
        }),
      );
      setChecks((current) => ({ ...current, [kind]: result }));
    },
  };
};

export type AccountsState = ReturnType<typeof useAccounts>;
