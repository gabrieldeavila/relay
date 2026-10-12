import { memo } from "react";
import { useTranslation } from "react-i18next";

import { Alert } from "@/ui/components/primitives/alert";
import { Badge } from "@/ui/components/primitives/badge";
import { API_URL } from "@/app/api/api-request";
import type { CatalogNode } from "@/app/flow/domain/types";
import { useNodeText } from "@/app/flow/hooks/useNodeText";
import { outputImage } from "../domain/output-image";
import { statusTone } from "../domain/status-tone";
import { stepStatuses } from "../domain/step-statuses";
import type { RunDetail } from "../domain/types";
import { waitingAction } from "../domain/waiting-action";
import { AttemptsList } from "./AttemptsList";
import { JsonBlock } from "./JsonBlock";
import { RunImage } from "./RunImage";
import { WaitingPanel } from "./WaitingPanel";

type StepDetailsProps = {
  run: RunDetail;
  nodeId: string;
  catalog: Map<string, CatalogNode>;
  busy: boolean;
  onAnswer: (url: string) => void;
};

/** One step of the run: status, how to answer it, errors, attempts, data in and out. */
export const StepDetails = memo(
  ({ run, nodeId, catalog, busy, onAnswer }: StepDetailsProps) => {
    const { t } = useTranslation("runs");
    const text = useNodeText();
    const node = run.graph.nodes.find((candidate) => candidate.id === nodeId);
    const step = run.steps.find((candidate) => candidate.nodeId === nodeId);
    const status = stepStatuses(run).get(nodeId) ?? "pending";
    const action =
      step && node ? waitingAction(run, step, node.type, API_URL) : null;
    const image =
      step?.status === "succeeded" ? outputImage(step.output) : null;

    return (
      <div className="flex flex-col gap-4 p-4">
        <header className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">
            {text.title(catalog.get(node?.type ?? ""), nodeId)}
          </h2>
          <div className="flex items-center gap-2">
            <Badge variant={statusTone(status)}>{t(`status.${status}`)}</Badge>
            {step?.port && step.port !== "out" && (
              <span className="text-xs text-(--color-text-muted)">
                {t("step.went", { port: text.port(step.port) })}
              </span>
            )}
            <code className="ml-auto font-mono text-xs text-(--color-text-muted)">
              {nodeId}
            </code>
          </div>
        </header>
        {action && step && (
          <WaitingPanel
            action={action}
            deadline={step.deadlineAt}
            busy={busy}
            onAnswer={onAnswer}
          />
        )}
        {step?.error && <Alert variant="danger">{step.error.message}</Alert>}
        {!step && (
          <p className="text-sm text-(--color-text-muted)">
            {t(`step.${status}`)}
          </p>
        )}
        {image && <RunImage key={image.url} image={image} />}
        {step && <AttemptsList attempts={step.attempts} />}
        {step?.input !== undefined && step?.input !== null && (
          <section className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold">{t("step.input")}</h3>
            <JsonBlock value={step.input} />
          </section>
        )}
        {step?.status === "succeeded" && (
          <section className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold">{t("step.output")}</h3>
            <JsonBlock value={step.output} />
          </section>
        )}
      </div>
    );
  },
);

StepDetails.displayName = "StepDetails";
