import { memo } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/ui/components/primitives/input";
import { Select } from "@/ui/components/primitives/select";
import {
  defaultTimeZone,
  FREQUENCIES,
  scheduleForFrequency,
  type Frequency,
  type ScheduleValue,
} from "../../domain/schedule-form";
import { FieldLabel } from "./FieldLabel";
import type { FieldProps } from "./field-props";
import { WeekdayPicker } from "./WeekdayPicker";

/** "Every week on Mon and Fri at 09:00" as plain controls, never cron. */
export const ScheduleField = memo(
  ({ field, label, value, onChange }: FieldProps) => {
    const { t } = useTranslation("editor");
    const schedule = (value ?? {}) as ScheduleValue;
    const set = (change: Record<string, unknown>) =>
      onChange({ ...schedule, ...change });
    const number = (raw: string) => (raw === "" ? undefined : Number(raw));

    return (
      <fieldset className="flex flex-col gap-3">
        <FieldLabel label={label} required={field.required} />
        <Select
          label={t("schedule.every")}
          value={schedule.every ?? ""}
          onChange={(event) =>
            onChange(
              scheduleForFrequency(event.target.value as Frequency, {
                timezone: defaultTimeZone(),
                ...schedule,
              }),
            )
          }
        >
          {!schedule.every && <option value="">—</option>}
          {FREQUENCIES.map((every) => (
            <option key={every} value={every}>
              {t(`schedule.frequency.${every}`)}
            </option>
          ))}
        </Select>
        {(schedule.every === "minutes" || schedule.every === "hours") && (
          <Input
            type="number"
            label={t("schedule.interval")}
            value={String(schedule.interval ?? "")}
            onChange={(event) => set({ interval: number(event.target.value) })}
          />
        )}
        {schedule.every === "hours" && (
          <Input
            type="number"
            label={t("schedule.minute")}
            value={String(schedule.minute ?? "")}
            onChange={(event) => set({ minute: number(event.target.value) })}
          />
        )}
        {schedule.every === "week" && (
          <WeekdayPicker
            value={(schedule.weekdays as string[] | undefined) ?? []}
            onChange={(weekdays) => set({ weekdays })}
          />
        )}
        {schedule.every === "month" && (
          <Input
            type="number"
            min={1}
            max={28}
            label={t("schedule.day")}
            value={String(schedule.day ?? "")}
            onChange={(event) => set({ day: number(event.target.value) })}
          />
        )}
        {schedule.every && !["minutes", "hours"].includes(schedule.every) && (
          <Input
            type="time"
            label={t("schedule.time")}
            value={String(schedule.time ?? "")}
            onChange={(event) => set({ time: event.target.value })}
          />
        )}
        {schedule.every && (
          <Input
            label={t("schedule.timezone")}
            value={String(schedule.timezone ?? "")}
            onChange={(event) => set({ timezone: event.target.value })}
          />
        )}
      </fieldset>
    );
  },
);

ScheduleField.displayName = "ScheduleField";
