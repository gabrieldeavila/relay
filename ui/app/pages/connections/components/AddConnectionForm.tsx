import { memo } from "react";
import { useTranslation } from "react-i18next";
import { FiLink } from "react-icons/fi";

import { Alert } from "@/ui/components/primitives/alert";
import { Button } from "@/ui/components/primitives/button";
import { Card } from "@/ui/components/primitives/card";
import { Input } from "@/ui/components/primitives/input";
import { RadioGroup } from "@/ui/components/primitives/radio-group";
import {
  CONNECTION_KINDS,
  isCommand,
  type ConnectionKind,
  type NewConnection,
} from "../domain/connection-kinds";
import { useAddConnectionForm } from "../hooks/useAddConnectionForm";

type AddConnectionFormProps = {
  onAdd: (connection: NewConnection) => Promise<void>;
};

export const AddConnectionForm = memo(({ onAdd }: AddConnectionFormProps) => {
  const { t } = useTranslation("connections");
  const form = useAddConnectionForm(onAdd);
  const command = isCommand(form.kind);

  return (
    <Card>
      <form onSubmit={(event) => void form.submit(event)}>
        <Card.Header>
          <Card.Title>{t("add.title")}</Card.Title>
          <p className="text-sm text-(--color-text-muted)">
            {t("add.description")}
          </p>
        </Card.Header>
        <Card.Body className="grid gap-3 sm:grid-cols-[1fr_2fr]">
          <RadioGroup
            className="sm:col-span-2"
            label={t("add.kind")}
            value={form.kind}
            onChange={(value) => form.setKind(value as ConnectionKind)}
            options={CONNECTION_KINDS.map((kind) => ({
              value: kind,
              label: t(`add.kinds.${kind}`),
            }))}
          />
          <Input
            label={t("add.name")}
            required
            value={form.name}
            onChange={(e) => form.setName(e.target.value)}
          />
          <Input
            label={t(command ? "add.command" : "add.url")}
            type={command ? "text" : "url"}
            required
            spellCheck={false}
            className="font-mono"
            placeholder={t(`add.placeholders.${form.kind}`)}
            hint={t(`add.hints.${form.kind}`)}
            value={form.address}
            onChange={(e) => form.setAddress(e.target.value)}
          />
          {command && (
            <Alert variant="warning" className="sm:col-span-2">
              {t("add.commandWarning")}
            </Alert>
          )}
          {form.error && (
            <Alert variant="danger" className="sm:col-span-2">
              {form.error}
            </Alert>
          )}
        </Card.Body>
        <Card.Footer>
          <Button
            type="submit"
            isLoading={form.saving}
            leftIcon={<FiLink aria-hidden="true" />}
          >
            {t("add.submit")}
          </Button>
        </Card.Footer>
      </form>
    </Card>
  );
});

AddConnectionForm.displayName = "AddConnectionForm";
