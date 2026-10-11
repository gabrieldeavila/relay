import { memo } from "react";
import { useTranslation } from "react-i18next";
import { FiGitBranch } from "react-icons/fi";

import { EmptyState } from "@/ui/components/primitives/empty-state";
import { WorkflowsHeader } from "./components/WorkflowsHeader";

export function meta() {
  return [{ title: "Relay" }];
}

const Workflows = memo(() => {
  const { t } = useTranslation("workflows");

  return (
    <main className="min-h-[100dvh] bg-(--color-bg) text-(--color-text)">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
        <WorkflowsHeader />
        <EmptyState
          icon={<FiGitBranch />}
          title={t("empty.title")}
          description={t("empty.description")}
        />
      </div>
    </main>
  );
});

Workflows.displayName = "Workflows";

export default Workflows;
