import { applyNodeChanges, type NodeChange } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { keepMeasured } from "@/app/flow/domain/keep-measured";
import {
  toFlowElements,
  type WorkflowFlowNode,
} from "@/app/flow/domain/to-flow-elements";
import type { CatalogNode } from "@/app/flow/domain/types";
import { useNodeText } from "@/app/flow/hooks/useNodeText";
import { nodeStatuses } from "../domain/node-statuses";
import type { RunDetail } from "../domain/types";

/** Read-only canvas of the run's version, each step colored by its status. */
export const useRunCanvas = (
  run: RunDetail,
  catalog: Map<string, CatalogNode>,
  selectedId: string | null,
) => {
  const { port } = useNodeText();
  const elements = useMemo(
    () =>
      toFlowElements(run.graph, catalog, {
        selectedId,
        statusByNode: nodeStatuses(run),
        portLabel: port,
      }),
    [run, catalog, selectedId, port],
  );
  const [nodes, setNodes] = useState<WorkflowFlowNode[]>([]);

  useEffect(() => {
    setNodes((previous) => keepMeasured(elements.nodes, previous));
  }, [elements.nodes]);

  // Only sizes measured by React Flow are applied; nothing here can be edited.
  const onNodesChange = useCallback(
    (changes: NodeChange<WorkflowFlowNode>[]) => {
      const sizes = changes.filter((change) => change.type === "dimensions");
      if (sizes.length) setNodes((current) => applyNodeChanges(sizes, current));
    },
    [],
  );

  return { nodes, edges: elements.edges, onNodesChange };
};
