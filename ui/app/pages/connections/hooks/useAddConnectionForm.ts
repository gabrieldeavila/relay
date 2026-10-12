import { useState, type FormEvent } from "react";

/** Pincel's default address is prefilled: it is the first app most people connect. */
export const useAddConnectionForm = (
  add: (name: string, baseUrl: string) => Promise<void>,
) => {
  const [name, setName] = useState("Pincel");
  const [baseUrl, setBaseUrl] = useState("http://localhost:4300");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await add(name.trim(), baseUrl.trim());
      setName("");
      setBaseUrl("");
    } catch (addError) {
      setError((addError as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return { name, setName, baseUrl, setBaseUrl, error, saving, submit };
};
