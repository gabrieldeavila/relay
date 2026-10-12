import { memo, type ComponentType } from "react";

import type { FieldKind } from "../../domain/schema-fields";
import { AnyField } from "./AnyField";
import { BooleanField } from "./BooleanField";
import type { FieldProps } from "./field-props";
import { KeyValueField } from "./KeyValueField";
import { LongTextField } from "./LongTextField";
import { NumberField } from "./NumberField";
import { ScheduleField } from "./ScheduleField";
import { SelectField } from "./SelectField";
import { TextField } from "./TextField";

const FIELDS: Record<FieldKind, ComponentType<FieldProps>> = {
  text: TextField,
  longText: LongTextField,
  number: NumberField,
  select: SelectField,
  boolean: BooleanField,
  keyValue: KeyValueField,
  schedule: ScheduleField,
  any: AnyField,
};

export const ConfigField = memo((props: FieldProps) => {
  const Field = FIELDS[props.field.kind];
  return (
    <div className="flex flex-col gap-1">
      <Field {...props} />
      {props.field.description && (
        <p className="text-xs text-(--color-text-muted)">
          {props.field.description}
        </p>
      )}
    </div>
  );
});

ConfigField.displayName = "ConfigField";
