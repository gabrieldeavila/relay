import type { NodeStatus } from "@/app/flow/domain/to-flow-elements";
import { statusTone } from "./status-tone";
import { stepStatuses } from "./step-statuses";
import type { RunDetail } from "./types";

const FADED = new Set(["skipped", "not_reached", "cancelled"]);

/** The run's step statuses as card decorations for the canvas. */
export function nodeStatuses(run: RunDetail): Map<string, NodeStatus> {
  return new Map(
    [...stepStatuses(run)].map(([nodeId, status]) => [
      nodeId,
      { key: status, tone: statusTone(status), faded: FADED.has(status) },
    ]),
  );
}
