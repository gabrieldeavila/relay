import { useCallback, useEffect, useState } from "react";

import {
  addConnection,
  listConnections,
  refreshConnection,
  removeConnection,
  type Connection,
} from "../api/connections-api";

/** Connected apps and what can be done with them; errors come back as text. */
export const useConnections = () => {
  const [connections, setConnections] = useState<Connection[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setConnections(await listConnections());
    } catch (loadError) {
      setError((loadError as Error).message);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const act = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id);
    setError(null);
    try {
      await action();
      await reload();
    } catch (actionError) {
      setError((actionError as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return {
    connections,
    error,
    busyId,
    /** Throws so the form can show the problem next to its fields. */
    add: async (name: string, baseUrl: string) => {
      await addConnection(name, baseUrl);
      await reload();
    },
    refresh: (id: string) => act(id, () => refreshConnection(id)),
    remove: (id: string) => act(id, () => removeConnection(id)),
  };
};
