import { useEffect, useState } from "react";

import type { Account } from "../api/accounts-api";
import { smtpPresetFor } from "../domain/smtp-preset";

const text = (value: unknown) => (typeof value === "string" ? value : "");

/** Fields of the email account; the server is filled in for known providers. */
export const useEmailForm = (saved: Account | undefined) => {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("587");
  const [secure, setSecure] = useState(false);
  const [from, setFrom] = useState("");

  // Show what is saved once it loads (and after each save).
  useEffect(() => {
    if (!saved) return;
    const s = saved.settings;
    setUser(text(s.user));
    setHost(text(s.host));
    setPort(String(s.port ?? 587));
    setSecure(s.secure === true);
    setFrom(text(s.from));
    setPassword("");
  }, [saved]);

  /** After the address is typed: Gmail, Outlook… need no server details. */
  const fillServer = () => {
    const preset = smtpPresetFor(user);
    if (!preset || host) return;
    setHost(preset.host);
    setPort(String(preset.port));
    setSecure(preset.secure);
  };

  return {
    fields: { user, password, host, port, secure, from },
    setUser,
    setPassword,
    setHost,
    setPort,
    setSecure,
    setFrom,
    fillServer,
    settings: () => ({
      user,
      host,
      port: Number(port),
      secure,
      ...(from.trim() ? { from: from.trim() } : {}),
    }),
  };
};
