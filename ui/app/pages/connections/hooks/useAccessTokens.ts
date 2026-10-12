import { useCallback, useEffect, useState } from "react";

import {
  createAccessToken,
  listAccessTokens,
  revokeAccessToken,
  type AccessTokens,
} from "../api/access-tokens-api";

/** Tokens for MCP clients; a new token's value is kept only until dismissed. */
export const useAccessTokens = () => {
  const [data, setData] = useState<AccessTokens | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setData(await listAccessTokens());
    } catch (loadError) {
      setError((loadError as Error).message);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      await reload();
    } catch (actionError) {
      setError((actionError as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return {
    data,
    created,
    busy,
    error,
    create: (name: string) =>
      run(async () => setCreated((await createAccessToken(name)).token)),
    revoke: (id: string) => run(() => revokeAccessToken(id).then(() => {})),
    dismissCreated: () => setCreated(null),
  };
};
