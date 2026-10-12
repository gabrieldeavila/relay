import { memo } from "react";
import { useTranslation } from "react-i18next";
import { FiCode } from "react-icons/fi";

import { DropdownMenu } from "@/ui/components/primitives/dropdown-menu";
import type { ExpressionChoice } from "../../hooks/useExpressionChoices";

type ExpressionMenuProps = {
  choices: ExpressionChoice[];
  onInsert: (expression: string) => void;
};

/** "Use a value": inserts `{{ … }}` so people never type expressions by hand. */
export const ExpressionMenu = memo(({ choices, onInsert }: ExpressionMenuProps) => {
  const { t } = useTranslation("editor");

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger
        aria-label={t("panel.insertValue")}
        className="inline-flex items-center gap-1 rounded-(--radius-sm) px-2 py-1 text-xs text-(--color-primary) hover:bg-(--color-surface-2)"
      >
        <FiCode aria-hidden="true" />
        {t("panel.insertValue")}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end" className="z-20 mt-1 w-72">
        {choices.length === 1 && (
          <p className="px-3 py-2 text-xs text-(--color-text-muted)">{t("panel.noValues")}</p>
        )}
        {choices.map((choice) => (
          <DropdownMenu.Item key={choice.expression} onClick={() => onInsert(choice.expression)}>
            <span className="flex flex-col items-start">
              <span>{choice.label}</span>
              <span className="font-mono text-xs text-(--color-text-muted)">{choice.expression}</span>
            </span>
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu>
  );
});

ExpressionMenu.displayName = "ExpressionMenu";
