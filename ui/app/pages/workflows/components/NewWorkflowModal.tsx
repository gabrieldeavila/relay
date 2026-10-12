import { memo } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/ui/components/primitives/input";
import { StandardModal } from "@/ui/components/primitives/standard-modal";
import type { useNewWorkflowModal } from "../hooks/useNewWorkflowModal";

type NewWorkflowModalProps = { modal: ReturnType<typeof useNewWorkflowModal> };

export const NewWorkflowModal = memo(({ modal }: NewWorkflowModalProps) => {
  const { t } = useTranslation(["workflows", "common"]);

  return (
    <StandardModal
      open={modal.open}
      onOpenChange={modal.setOpen}
      title={t("newModal.title")}
      saveLabel={t("newModal.save")}
      cancelLabel={t("common:cancel")}
      saveDisabled={!modal.name.trim()}
      saveLoading={modal.saving}
      onSave={modal.save}
    >
      <Input
        autoFocus
        label={t("newModal.name")}
        placeholder={t("newModal.placeholder")}
        value={modal.name}
        error={modal.error ?? undefined}
        onChange={(event) => modal.setName(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && void modal.save()}
      />
    </StandardModal>
  );
});

NewWorkflowModal.displayName = "NewWorkflowModal";
