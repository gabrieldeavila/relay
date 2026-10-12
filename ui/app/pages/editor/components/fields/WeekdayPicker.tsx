import { memo } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/ui/helpers/cn";
import { toggleWeekday, WEEKDAYS } from "../../domain/schedule-form";

type WeekdayPickerProps = {
  value: string[];
  onChange: (weekdays: string[]) => void;
};

export const WeekdayPicker = memo(({ value, onChange }: WeekdayPickerProps) => {
  const { t } = useTranslation("editor");
  return (
    <div
      role="group"
      aria-label={t("schedule.weekdays")}
      className="flex flex-col gap-1"
    >
      <span className="text-sm font-medium">{t("schedule.weekdays")}</span>
      <div className="flex flex-wrap gap-1">
        {WEEKDAYS.map((day) => (
          <button
            key={day}
            type="button"
            aria-pressed={value.includes(day)}
            onClick={() => onChange(toggleWeekday(value, day))}
            className={cn(
              "rounded-(--radius-sm) border px-2 py-1 text-xs",
              value.includes(day)
                ? "border-(--color-primary) bg-(--color-primary) text-(--color-bg)"
                : "border-(--color-border) hover:bg-(--color-surface-2)",
            )}
          >
            {t(`schedule.weekday.${day}`)}
          </button>
        ))}
      </div>
    </div>
  );
});

WeekdayPicker.displayName = "WeekdayPicker";
