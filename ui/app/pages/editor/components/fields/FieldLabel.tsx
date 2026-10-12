import { memo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

type FieldLabelProps = { htmlFor?: string; label: string; required: boolean; action?: ReactNode };

/** Label row with the "required" mark and an optional action (e.g. Use a value). */
export const FieldLabel = memo(({ htmlFor, label, required, action }: FieldLabelProps) => {
  const { t } = useTranslation("editor");
  return (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-xs text-(--color-text-muted)">({t("panel.required")})</span>}
      </label>
      {action}
    </div>
  );
});

FieldLabel.displayName = "FieldLabel";
