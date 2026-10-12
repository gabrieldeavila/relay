import { memo } from "react";
import { useTranslation } from "react-i18next";
import { FiLink } from "react-icons/fi";

import { Alert } from "@/ui/components/primitives/alert";
import { Button } from "@/ui/components/primitives/button";
import { Card } from "@/ui/components/primitives/card";
import { Input } from "@/ui/components/primitives/input";
import { useAddConnectionForm } from "../hooks/useAddConnectionForm";

type AddConnectionFormProps = {
  onAdd: (name: string, baseUrl: string) => Promise<void>;
};

export const AddConnectionForm = memo(({ onAdd }: AddConnectionFormProps) => {
  const { t } = useTranslation("connections");
  const form = useAddConnectionForm(onAdd);

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
          <Input
            label={t("add.name")}
            required
            value={form.name}
            onChange={(e) => form.setName(e.target.value)}
          />
          <Input
            label={t("add.url")}
            type="url"
            required
            hint={t("add.urlHint")}
            value={form.baseUrl}
            onChange={(e) => form.setBaseUrl(e.target.value)}
          />
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
