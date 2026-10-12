import { memo } from "react";
import { useTranslation } from "react-i18next";
import { FiGitBranch } from "react-icons/fi";

import { Alert } from "@/ui/components/primitives/alert";
import { Button } from "@/ui/components/primitives/button";
import { EmptyState } from "@/ui/components/primitives/empty-state";
import { Spinner } from "@/ui/components/primitives/spinner";
import { NewWorkflowModal } from "./components/NewWorkflowModal";
import { WorkflowRow } from "./components/WorkflowRow";
import { WorkflowsHeader } from "./components/WorkflowsHeader";
import { useNewWorkflowModal } from "./hooks/useNewWorkflowModal";
import { useWorkflows } from "./hooks/useWorkflows";

export function meta() {
  return [{ title: "Relay" }];
}

const Workflows = memo(() => {
  const { t } = useTranslation("workflows");
  const { workflows, error, create } = useWorkflows();
  const modal = useNewWorkflowModal(create);

  return (
    <main className="min-h-[100dvh] bg-(--color-bg) text-(--color-text)">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
        <WorkflowsHeader onCreate={() => modal.openWith()} />
        {error && <Alert variant="danger">{error}</Alert>}
        {!workflows && !error ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : workflows?.length ? (
          <ul className="flex flex-col gap-2">
            {workflows.map((workflow) => (
              <WorkflowRow key={workflow.id} workflow={workflow} />
            ))}
          </ul>
        ) : (
          !error && (
            <EmptyState
              icon={<FiGitBranch />}
              title={t("empty.title")}
              description={t("empty.description")}
              action={
                <Button onClick={() => modal.openWith()}>{t("create")}</Button>
              }
            />
          )
        )}
      </div>
      <NewWorkflowModal modal={modal} />
    </main>
  );
});

Workflows.displayName = "Workflows";

export default Workflows;
