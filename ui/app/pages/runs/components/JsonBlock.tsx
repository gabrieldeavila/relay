import { memo } from "react";

const MAX_CHARS = 20_000;

/** Step input or output as readable JSON (long values are cut). */
export const JsonBlock = memo(({ value }: { value: unknown }) => {
  const text = JSON.stringify(value ?? null, null, 2);
  return (
    <pre className="max-h-64 overflow-auto rounded-(--radius-sm) bg-(--color-surface-2) p-2 font-mono text-xs whitespace-pre-wrap break-all">
      {text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}\n…` : text}
    </pre>
  );
});

JsonBlock.displayName = "JsonBlock";
