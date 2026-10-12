import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiCopy } from "react-icons/fi";

import { Button } from "@/ui/components/primitives/button";
import type { TriggerInfo } from "../api/editor-api";

type TriggerPanelProps = { trigger: TriggerInfo | null; published: boolean };

/** How the published version starts: manual, its webhook link, or next scheduled run. */
export const TriggerPanel = memo(({ trigger, published }: TriggerPanelProps) => {
  const { t, i18n } = useTranslation(["editor", "common"]);
  const [copied, setCopied] = useState(false);

  const copy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold">{t("trigger.title")}</h2>
      {!published || !trigger ? (
        <p className="text-sm text-(--color-text-muted)">{t("trigger.publishFirst")}</p>
      ) : trigger.kind === "manual" ? (
        <p className="text-sm text-(--color-text-muted)">{t("trigger.manual")}</p>
      ) : trigger.kind === "webhook" ? (
        <>
          <p className="text-sm text-(--color-text-muted)">{t("trigger.webhook")}</p>
          <code className="break-all rounded-(--radius-sm) bg-(--color-surface-2) p-2 font-mono text-xs">
            {trigger.url}
          </code>
          <Button
            size="sm"
            variant="secondary"
            className="self-start"
            leftIcon={<FiCopy aria-hidden="true" />}
            onClick={() => void copy(trigger.url)}
          >
            {copied ? t("common:copied") : t("common:copy")}
          </Button>
        </>
      ) : (
        <p className="text-sm text-(--color-text-muted)">
          {t("trigger.schedule")}{" "}
          <strong className="text-(--color-text)">
            {trigger.nextFireAt
              ? new Date(trigger.nextFireAt).toLocaleString(i18n.language, {
                  dateStyle: "full",
                  timeStyle: "short",
                })
              : t("trigger.noNextRun")}
          </strong>
        </p>
      )}
    </section>
  );
});

TriggerPanel.displayName = "TriggerPanel";
