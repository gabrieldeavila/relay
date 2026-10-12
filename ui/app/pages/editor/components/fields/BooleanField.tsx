import { memo } from "react";

import { Switch } from "@/ui/components/primitives/switch";
import type { FieldProps } from "./field-props";

export const BooleanField = memo(({ label, value, onChange }: FieldProps) => (
  <Switch
    label={label}
    checked={value === true}
    onChange={(event) => onChange(event.target.checked)}
  />
));

BooleanField.displayName = "BooleanField";
