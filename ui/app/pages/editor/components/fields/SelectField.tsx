import { memo, useId } from "react";

import { Select } from "@/ui/components/primitives/select";
import { useNodeText } from "@/app/flow/hooks/useNodeText";
import { FieldLabel } from "./FieldLabel";
import type { FieldProps } from "./field-props";

export const SelectField = memo(
  ({ field, label, value, onChange }: FieldProps) => {
    const id = useId();
    const text = useNodeText();
    return (
      <div className="flex flex-col gap-1">
        <FieldLabel htmlFor={id} label={label} required={field.required} />
        <Select
          id={id}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value || undefined)}
        >
          {value === undefined && <option value="">—</option>}
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {text.option(option)}
            </option>
          ))}
        </Select>
      </div>
    );
  },
);

SelectField.displayName = "SelectField";
