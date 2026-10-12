import { memo, useId } from "react";

import { Input } from "@/ui/components/primitives/input";
import { FieldLabel } from "./FieldLabel";
import type { FieldProps } from "./field-props";

export const NumberField = memo(({ field, label, value, onChange }: FieldProps) => {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel htmlFor={id} label={label} required={field.required} />
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        value={typeof value === "number" ? value : ""}
        onChange={(event) =>
          onChange(event.target.value === "" ? undefined : Number(event.target.value))
        }
      />
    </div>
  );
});

NumberField.displayName = "NumberField";
