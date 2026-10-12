import { useState } from "react";

/** Open state and name field of the "new workflow" dialog. */
export const useNewWorkflowModal = (
  create: (name: string) => Promise<void>,
) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await create(name.trim());
    } catch (saveError) {
      setError((saveError as Error).message);
      setSaving(false);
    }
  };

  const openWith = (value = "") => {
    setName(value);
    setError(null);
    setOpen(true);
  };

  return { open, setOpen, openWith, name, setName, saving, error, save };
};
