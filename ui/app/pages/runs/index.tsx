import { ReactFlowProvider } from "@xyflow/react";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiArrowLeft } from "react-icons/fi";
import { Link, useParams } from "react-router";

import { Alert } from "@/ui/components/primitives/alert";
import { EmptyState } from "@/ui/components/primitives/empty-state";
import { Spinner } from "@/ui/components/primitives/spinner";
import { Toasts } from "@/app/components/Toasts";
import { useCatalog } from "@/app/flow/hooks/useCatalog";
import { useToasts } from "@/app/hooks/useToasts";
import { RunCanvas } from "./components/RunCanvas";
import { RunHeader } from "./components/RunHeader";
import { RunsSidebar } from "./components/RunsSidebar";
import { StepDetails } from "./components/StepDetails";
import { useRunActions } from "./hooks/useRunActions";
import { useRunsList } from "./hooks/useRunsList";
import { useRunStream } from "./hooks/useRunStream";
import { useStepSelection } from "./hooks/useStepSelection";
import { withLiveStatus } from "./domain/with-live-status";

export function meta() {
  return [{ title: "Relay" }];
}

const Runs = memo(() => {
  const { t } = useTranslation("runs");
  const { id: workflowId = "", runId } = useParams();
  const [generation, setGeneration] = useState(0);
  const toasts = useToasts();
  const catalog = useCatalog();
  const list = useRunsList(workflowId);
  const activeId = runId ?? list.runs?.[0]?.id;
  const { run, error } = useRunStream(activeId, generation);
  const selection = useStepSelection(run);
  const actions = useRunActions(
    run,
    () => {
      setGeneration((value) => value + 1);
      void list.reload();
    },
    toasts,
  );

  return (
    <main className="flex h-[100dvh] flex-col bg-(--color-bg) text-(--color-text)">
      <header className="flex items-center gap-3 border-b border-(--color-border) px-4 py-2">
        <Link
          to={`/workflows/${workflowId}`}
          className="inline-flex items-center gap-1 text-sm text-(--color-text-muted) hover:text-(--color-text)"
        >
          <FiArrowLeft aria-hidden="true" />
          {t("backToEditor")}
        </Link>
        <h1 className="font-semibold">{t("title", { name: list.name })}</h1>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-[220px_1fr_360px]">
        <aside className="overflow-y-auto border-r border-(--color-border)">
          {list.runs && (
            <RunsSidebar
              workflowId={workflowId}
              runs={withLiveStatus(list.runs, run)}
              activeId={activeId}
            />
          )}
        </aside>
        <section className="flex min-h-0 flex-col">
          {(error ?? list.error) && (
            <Alert variant="danger">{error ?? list.error}</Alert>
          )}
          {run ? (
            <>
              <RunHeader
                run={run}
                busy={actions.busy}
                onCancel={() => void actions.cancel()}
                onRetry={() => void actions.retry()}
                onRunAgain={() => void actions.runAgain()}
              />
              <div className="min-h-0 flex-1">
                <ReactFlowProvider>
                  <RunCanvas
                    run={run}
                    catalog={catalog.byType}
                    selectedId={selection.selectedId}
                    onSelect={selection.select}
                  />
                </ReactFlowProvider>
              </div>
            </>
          ) : list.runs && !activeId ? (
            <div className="p-8">
              <EmptyState
                title={t("list.emptyTitle")}
                description={t("list.emptyDescription")}
              />
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <Spinner size="lg" />
            </div>
          )}
        </section>
        <aside className="overflow-y-auto border-l border-(--color-border)">
          {run && selection.selectedId ? (
            <StepDetails
              run={run}
              nodeId={selection.selectedId}
              catalog={catalog.byType}
              busy={actions.busy === "answer"}
              onAnswer={(url) => void actions.answer(url)}
            />
          ) : (
            run && (
              <p className="p-4 text-sm text-(--color-text-muted)">
                {t("step.pick")}
              </p>
            )
          )}
        </aside>
      </div>
      <Toasts toasts={toasts.toasts} onDismiss={toasts.dismiss} />
    </main>
  );
});

Runs.displayName = "Runs";

export default Runs;
