import { memo } from "react";
import { useTranslation } from "react-i18next";

import { Alert } from "@/ui/components/primitives/alert";
import { Button } from "@/ui/components/primitives/button";
import { Card } from "@/ui/components/primitives/card";
import { Input } from "@/ui/components/primitives/input";
import { useLoginForm } from "../hooks/useLoginForm";

export const LoginForm = memo(() => {
  const { t } = useTranslation("auth");
  const form = useLoginForm();

  return (
    <Card className="w-full max-w-sm">
      <form onSubmit={(event) => void form.submit(event)}>
        <Card.Header>
          <Card.Title>{t(`${form.mode}.title`)}</Card.Title>
          <p className="text-sm text-(--color-text-muted)">{t("localOnly")}</p>
        </Card.Header>
        <Card.Body className="flex flex-col gap-4">
          {form.errorKey && <Alert variant="danger">{t(form.errorKey)}</Alert>}
          <Input
            label={t("email")}
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(event) => form.setEmail(event.target.value)}
          />
          <Input
            label={t("password")}
            type="password"
            autoComplete={form.mode === "signIn" ? "current-password" : "new-password"}
            minLength={6}
            required
            hint={form.mode === "signUp" ? t("passwordHint") : undefined}
            value={form.password}
            onChange={(event) => form.setPassword(event.target.value)}
          />
        </Card.Body>
        <Card.Footer className="flex flex-col items-stretch gap-2">
          <Button type="submit" isLoading={form.submitting}>
            {t(`${form.mode}.submit`)}
          </Button>
          <Button type="button" variant="ghost" onClick={form.toggleMode}>
            {t(`${form.mode}.switch`)}
          </Button>
        </Card.Footer>
      </form>
    </Card>
  );
});

LoginForm.displayName = "LoginForm";
