import "@xyflow/react/dist/style.css";

import { Background, Controls, ReactFlow } from "@xyflow/react";
import { memo } from "react";

import { WorkflowNodeCard } from "@/app/flow/components/WorkflowNodeCard";
import type { CatalogNode } from "@/app/flow/domain/types";
import type { RunDetail } from "../domain/types";
import { useRunCanvas } from "../hooks/useRunCanvas";

const NODE_TYPES = { workflow: WorkflowNodeCard };

type RunCanvasProps = {
  run: RunDetail;
  catalog: Map<string, CatalogNode>;
  selectedId: string | null;
  onSelect: (nodeId: string) => void;
};

/** The flow as it ran: read-only, click a step to see its details. */
export const RunCanvas = memo(
  ({ run, catalog, selectedId, onSelect }: RunCanvasProps) => {
    const { nodes, edges, onNodesChange } = useRunCanvas(
      run,
      catalog,
      selectedId,
    );
    return (
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        onNodeClick={(_event, node) => onSelect(node.id)}
        nodesDraggable={false}
        nodesConnectable={false}
        deleteKeyCode={null}
        colorMode="dark"
        fitView
        fitViewOptions={{ maxZoom: 1 }}
      >
        <Background gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    );
  },
);

RunCanvas.displayName = "RunCanvas";
