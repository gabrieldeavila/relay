import { memo } from "react";
import { useTranslation } from "react-i18next";
import { FiCheck, FiCopy } from "react-icons/fi";

import { Button } from "@/ui/components/primitives/button";
import { useCopy } from "../hooks/useCopy";

type CopyFieldProps = { label: string; value: string };

/** Read-only text (a command, an address) with a copy button. */
export const CopyField = memo(({ label, value }: CopyFieldProps) => {
  const { t } = useTranslation();
  const { copied, copy } = useCopy();

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-start gap-2">
        <code className="min-w-0 flex-1 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-2) px-3 py-2 font-mono text-xs break-all">
          {value}
        </code>
        <Button
          size="sm"
          variant="secondary"
          leftIcon={
            copied ? (
              <FiCheck aria-hidden="true" />
            ) : (
              <FiCopy aria-hidden="true" />
            )
          }
          onClick={() => void copy(value)}
        >
          {t(copied ? "copied" : "copy")}
        </Button>
      </div>
    </div>
  );
});

CopyField.displayName = "CopyField";
