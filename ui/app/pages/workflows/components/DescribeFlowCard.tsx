import { memo } from "react";
import { useTranslation } from "react-i18next";
import { FiZap } from "react-icons/fi";
import { Link } from "react-router";

import { Alert } from "@/ui/components/primitives/alert";
import { Button } from "@/ui/components/primitives/button";
import { Card } from "@/ui/components/primitives/card";
import { Textarea } from "@/ui/components/primitives/textarea";
import { useDescribeFlow } from "../hooks/useDescribeFlow";
import { DraftSummary } from "./DraftSummary";

type DescribeFlowCardProps = { onDrafted: () => void };

/** "Describe what you want": Claude drafts the flow, Relay checks it, you finish it. */
export const DescribeFlowCard = memo(({ onDrafted }: DescribeFlowCardProps) => {
  const { t } = useTranslation("workflows");
  const flow = useDescribeFlow(onDrafted);

  return (
    <Card>
      <form onSubmit={(event) => void flow.submit(event)}>
        <Card.Header>
          <Card.Title>{t("describe.title")}</Card.Title>
          <p className="text-sm text-(--color-text-muted)">
            {t("describe.subtitle")}
          </p>
        </Card.Header>
        <Card.Body className="flex flex-col gap-3">
          <Textarea
            label={t("describe.label")}
            placeholder={t("describe.placeholder")}
            rows={3}
            required
            minLength={3}
            maxLength={4000}
            value={flow.description}
            onChange={(e) => flow.setDescription(e.target.value)}
          />
          {flow.error && (
            <Alert variant="danger">
              {flow.error}
              {flow.needsKey && (
                <>
                  {" "}
                  <Link to="/connections" className="underline">
                    {t("connections")}
                  </Link>
                </>
              )}
            </Alert>
          )}
          {flow.draft && <DraftSummary draft={flow.draft} />}
        </Card.Body>
        <Card.Footer className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            isLoading={flow.drafting}
            leftIcon={<FiZap aria-hidden="true" />}
          >
            {t(flow.drafting ? "describe.drafting" : "describe.submit")}
          </Button>
          <p className="text-xs text-(--color-text-muted)">
            {t("describe.privacy")}
          </p>
        </Card.Footer>
      </form>
    </Card>
  );
});

DescribeFlowCard.displayName = "DescribeFlowCard";
