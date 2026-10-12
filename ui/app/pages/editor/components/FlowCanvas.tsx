import "@xyflow/react/dist/style.css";

import {
  Background,
  Controls,
  ReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { memo } from "react";
import { useTranslation } from "react-i18next";

import type { WorkflowFlowNode } from "../domain/to-flow-elements";
import { WorkflowNodeCard } from "./WorkflowNodeCard";

const NODE_TYPES = { workflow: WorkflowNodeCard };

type FlowCanvasProps = {
  nodes: WorkflowFlowNode[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange<WorkflowFlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onBackgroundClick: () => void;
};

export const FlowCanvas = memo((props: FlowCanvasProps) => {
  const { t } = useTranslation("editor");

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={props.nodes}
        edges={props.edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={props.onNodesChange}
        onEdgesChange={props.onEdgesChange}
        onConnect={props.onConnect}
        onPaneClick={props.onBackgroundClick}
        colorMode="dark"
        fitView
        fitViewOptions={{ maxZoom: 1 }}
        deleteKeyCode={["Backspace", "Delete"]}
      >
        <Background gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
      {props.nodes.length === 0 && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-8 text-center text-(--color-text-muted)">
          {t("canvas.empty")}
        </p>
      )}
    </div>
  );
});

FlowCanvas.displayName = "FlowCanvas";
