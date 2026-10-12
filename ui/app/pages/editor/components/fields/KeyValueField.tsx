import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiPlus, FiX } from "react-icons/fi";

import { Button } from "@/ui/components/primitives/button";
import { IconButton } from "@/ui/components/primitives/icon-button";
import { Input } from "@/ui/components/primitives/input";
import { recordFromRows, rowsFromRecord, type KeyValueRow } from "../../domain/key-value-rows";
import { ExpressionMenu } from "./ExpressionMenu";
import { FieldLabel } from "./FieldLabel";
import { appendExpression, type FieldProps } from "./field-props";

/** Named values (headers, fields): one row per name, values can use `{{ }}`. */
export const KeyValueField = memo(({ field, label, value, onChange, choices }: FieldProps) => {
  const { t } = useTranslation("editor");
  const [rows, setRows] = useState<KeyValueRow[]>(() => rowsFromRecord(value));

  const update = (next: KeyValueRow[]) => {
    setRows(next);
    onChange(recordFromRows(next, field.valueKind ?? "any"));
  };
  const edit = (index: number, change: Partial<KeyValueRow>) =>
    update(rows.map((row, i) => (i === index ? { ...row, ...change } : row)));

  return (
    <div className="flex flex-col gap-2">
      <FieldLabel label={label} required={field.required} />
      {rows.map((row, index) => (
        <div key={index} className="flex flex-col gap-1 rounded-(--radius-sm) border border-(--color-border) p-2">
          <div className="flex items-center gap-1">
            <Input
              aria-label={t("panel.pairName")}
              placeholder={t("panel.pairName")}
              value={row.name}
              onChange={(event) => edit(index, { name: event.target.value })}
            />
            <IconButton
              label={t("panel.removePair")}
              icon={<FiX aria-hidden="true" />}
              variant="ghost"
              size="sm"
              onClick={() => update(rows.filter((_, i) => i !== index))}
            />
          </div>
          <Input
            aria-label={t("panel.pairValue")}
            placeholder={t("panel.pairValue")}
            value={row.value}
            onChange={(event) => edit(index, { value: event.target.value })}
          />
          <div className="self-end">
            <ExpressionMenu
              choices={choices}
              onInsert={(e) => edit(index, { value: appendExpression(row.value, e) })}
            />
          </div>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<FiPlus aria-hidden="true" />}
        onClick={() => update([...rows, { name: "", value: "" }])}
      >
        {t("panel.addPair")}
      </Button>
    </div>
  );
});

KeyValueField.displayName = "KeyValueField";
