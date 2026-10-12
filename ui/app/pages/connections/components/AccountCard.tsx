import { memo, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { FiCheckCircle, FiTrash2 } from "react-icons/fi";

import { Alert } from "@/ui/components/primitives/alert";
import { Badge } from "@/ui/components/primitives/badge";
import { Button } from "@/ui/components/primitives/button";
import { Card } from "@/ui/components/primitives/card";
import type { AccountCardState } from "../hooks/useAccountCard";

type AccountCardProps = {
  title: string;
  description: ReactNode;
  card: AccountCardState;
  onSubmit: (event: FormEvent) => void;
  children: ReactNode;
  /** Shown under the fields once the account is saved (e.g. the chat picker). */
  extra?: ReactNode;
};

/** Frame shared by the account cards: status, fields, Save / Test / Remove. */
export const AccountCard = memo(
  ({
    title,
    description,
    card,
    onSubmit,
    children,
    extra,
  }: AccountCardProps) => {
    const { t } = useTranslation("connections");

    return (
      <Card>
        <form onSubmit={onSubmit}>
          <Card.Header>
            <div className="flex items-center justify-between gap-2">
              <Card.Title>{title}</Card.Title>
              <Badge variant={card.saved ? "success" : "default"} showIndicator>
                {card.saved ? t("accounts.ready") : t("accounts.notSetUp")}
              </Badge>
            </div>
            <p className="text-sm text-(--color-text-muted)">{description}</p>
          </Card.Header>
          <Card.Body className="grid gap-3">
            {children}
            {card.saved && extra}
            {card.error && <Alert variant="danger">{card.error}</Alert>}
            {card.check && (
              <Alert variant={card.check.ok ? "success" : "danger"}>
                {card.check.message}
              </Alert>
            )}
          </Card.Body>
          <Card.Footer className="flex flex-wrap gap-2">
            <Button type="submit" isLoading={card.busy === "save"}>
              {t("accounts.save")}
            </Button>
            {card.saved && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  isLoading={card.busy === "test"}
                  leftIcon={<FiCheckCircle aria-hidden="true" />}
                  onClick={() => void card.test()}
                >
                  {t("accounts.test")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  isLoading={card.busy === "remove"}
                  leftIcon={<FiTrash2 aria-hidden="true" />}
                  onClick={() => void card.remove()}
                >
                  {t("accounts.remove")}
                </Button>
              </>
            )}
          </Card.Footer>
        </form>
      </Card>
    );
  },
);

AccountCard.displayName = "AccountCard";
