import { Handle, Position, type NodeProps } from "@xyflow/react";
import { memo } from "react";
import { FiAlertCircle, FiZap } from "react-icons/fi";

import { cn } from "@/ui/helpers/cn";
import type { WorkflowFlowNode } from "../domain/to-flow-elements";
import { useNodeText } from "../hooks/useNodeText";
import { NodeStatusLabel } from "./NodeStatusLabel";

const TONE_BORDER = {
  default: "border-(--color-border-strong)",
  info: "border-(--color-primary)",
  success: "border-(--color-success)",
  warning: "border-(--color-warning)",
  danger: "border-(--color-danger)",
} as const;

/** A step on the canvas: one input on the left, one handle per exit on the right. */
export const WorkflowNodeCard = memo(
  ({ data, selected }: NodeProps<WorkflowFlowNode>) => {
    const text = useNodeText();
    const { catalog, issues, nodeId, status } = data;
    const ports = catalog?.outputPorts ?? ["out"];
    const isTrigger = catalog?.kind === "trigger";

    return (
      <div
        className={cn(
          "w-56 rounded-(--radius-md) border bg-(--color-surface) px-3 py-2 shadow-(--shadow-sm)",
          status
            ? TONE_BORDER[status.tone]
            : selected
              ? "border-(--color-primary)"
              : "border-(--color-border-strong)",
          issues.length > 0 && "border-(--color-danger)",
          status && selected && "ring-2 ring-(--color-primary)",
          status?.faded && "opacity-50",
        )}
      >
        {!isTrigger && <Handle type="target" position={Position.Left} />}
        <div className="flex items-center gap-2">
          {isTrigger && (
            <FiZap
              aria-hidden="true"
              className="shrink-0 text-(--color-warning)"
            />
          )}
          <p className="truncate text-sm font-medium">{text.title(catalog)}</p>
          {issues.length > 0 && (
            <FiAlertCircle
              aria-label={text.issue(issues[0])}
              className="ml-auto shrink-0 text-(--color-danger)"
            />
          )}
        </div>
        <p className="truncate font-mono text-xs text-(--color-text-muted)">
          {nodeId}
        </p>
        {status && <NodeStatusLabel status={status} />}
        {ports.length > 1 && (
          <ul className="mt-2 flex flex-col gap-1 text-right text-xs text-(--color-text-muted)">
            {ports.map((port) => (
              <li key={port} className="relative pr-1">
                {text.port(port)}
                <Handle
                  type="source"
                  id={port}
                  position={Position.Right}
                  // Centered on the card border: the list sits inside px-3 (12px).
                  style={{ right: -12 }}
                />
              </li>
            ))}
          </ul>
        )}
        {ports.length === 1 && (
          <Handle type="source" id={ports[0]} position={Position.Right} />
        )}
      </div>
    );
  },
);

WorkflowNodeCard.displayName = "WorkflowNodeCard";
