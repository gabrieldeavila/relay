import { memo, useId } from "react";

import { Input } from "@/ui/components/primitives/input";
import { ExpressionMenu } from "./ExpressionMenu";
import { FieldLabel } from "./FieldLabel";
import { appendExpression, type FieldProps } from "./field-props";

export const TextField = memo(({ field, label, value, onChange, choices }: FieldProps) => {
  const id = useId();
  const text = typeof value === "string" ? value : "";
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel
        htmlFor={id}
        label={label}
        required={field.required}
        action={<ExpressionMenu choices={choices} onInsert={(e) => onChange(appendExpression(text, e))} />}
      />
      <Input
        id={id}
        value={text}
        placeholder={field.placeholder}
        onChange={(event) => onChange(event.target.value || undefined)}
      />
    </div>
  );
});

TextField.displayName = "TextField";
