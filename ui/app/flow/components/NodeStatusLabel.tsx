import { memo } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/ui/components/primitives/badge";
import type { NodeStatus } from "../domain/to-flow-elements";

/** The step's state in a run; the text carries the meaning, not just the color. */
export const NodeStatusLabel = memo(({ status }: { status: NodeStatus }) => {
  const { t } = useTranslation("runs");
  return (
    <Badge size="sm" variant={status.tone} className="mt-1">
      {t(`status.${status.key}`)}
    </Badge>
  );
});

NodeStatusLabel.displayName = "NodeStatusLabel";
