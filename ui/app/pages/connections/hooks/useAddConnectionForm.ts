import { useState, type FormEvent } from "react";

import {
  connectionDefaults,
  newConnection,
  type ConnectionKind,
  type NewConnection,
} from "../domain/connection-kinds";

/** The add form: which kind of app, its name, and its address or command. */
export const useAddConnectionForm = (
  add: (connection: NewConnection) => Promise<void>,
) => {
  const [kind, setKindState] = useState<ConnectionKind>("tools_api");
  const [name, setName] = useState(connectionDefaults("tools_api").name);
  const [address, setAddress] = useState(
    connectionDefaults("tools_api").address,
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /** Switching kind swaps the prefilled values, never what the user typed. */
  const setKind = (next: ConnectionKind) => {
    const before = connectionDefaults(kind);
    const after = connectionDefaults(next);
    if (name === before.name) setName(after.name);
    if (address === before.address) setAddress(after.address);
    setKindState(next);
    setError(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await add(newConnection(kind, name, address));
      setName("");
      setAddress("");
    } catch (addError) {
      setError((addError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return {
    kind,
    setKind,
    name,
    setName,
    address,
    setAddress,
    error,
    saving,
    submit,
  };
};
