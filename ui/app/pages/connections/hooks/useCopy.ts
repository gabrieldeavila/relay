import { useState } from "react";

/** Copies text and says so for two seconds. */
export const useCopy = () => {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return { copied, copy };
};
