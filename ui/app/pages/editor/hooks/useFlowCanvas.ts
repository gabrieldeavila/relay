import {
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { keepMeasured } from "@/app/flow/domain/keep-measured";
import { useNodeText } from "@/app/flow/hooks/useNodeText";
import { nextNodePosition } from "../domain/canvas-layout";
import {
  addNode,
  connect,
  moveNode,
  removeEdges,
  removeNodes,
} from "../domain/graph-ops";
import {
  toFlowElements,
  type WorkflowFlowNode,
} from "@/app/flow/domain/to-flow-elements";
import type {
  CatalogNode,
  GraphIssue,
  WorkflowGraph,
} from "@/app/flow/domain/types";

type SetGraph = (update: (graph: WorkflowGraph) => WorkflowGraph) => void;

/**
 * Bridges React Flow and the draft graph. React Flow keeps its own node state
 * (it needs measured sizes); the graph is updated when a drag ends, a node or
 * edge is removed, or nodes are connected.
 */
export const useFlowCanvas = (
  graph: WorkflowGraph,
  setGraph: SetGraph,
  catalog: Map<string, CatalogNode>,
  issuesByNode: Map<string, GraphIssue[]>,
) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<WorkflowFlowNode[]>([]);
  const { port } = useNodeText();
  const elements = useMemo(
    () =>
      toFlowElements(graph, catalog, {
        selectedId,
        issuesByNode,
        portLabel: port,
      }),
    [graph, catalog, issuesByNode, selectedId, port],
  );

  useEffect(() => {
    setNodes((previous) => keepMeasured(elements.nodes, previous));
  }, [elements.nodes]);

  const onNodesChange = useCallback(
    (changes: NodeChange<WorkflowFlowNode>[]) => {
      setNodes((current) => applyNodeChanges(changes, current));
      for (const change of changes) {
        if (
          change.type === "position" &&
          change.dragging === false &&
          change.position
        ) {
          const { id, position } = change;
          setGraph((current) => moveNode(current, id, position));
        }
        if (change.type === "remove") {
          setGraph((current) => removeNodes(current, [change.id]));
          setSelectedId((current) => (current === change.id ? null : current));
        }
        if (change.type === "select" && change.selected)
          setSelectedId(change.id);
      }
    },
    [setGraph],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const removed = changes.flatMap((change) =>
        change.type === "remove" ? [change.id] : [],
      );
      if (removed.length) setGraph((current) => removeEdges(current, removed));
    },
    [setGraph],
  );

  const onConnect = useCallback(
    ({ source, sourceHandle, target }: Connection) => {
      setGraph((current) => {
        const typeOf = new Map(
          current.nodes.map((node) => [node.id, node.type]),
        );
        const isTrigger = (id: string) =>
          catalog.get(typeOf.get(id) ?? "")?.kind === "trigger";
        return connect(
          current,
          { source, sourcePort: sourceHandle ?? "out", target },
          isTrigger,
        );
      });
    },
    [catalog, setGraph],
  );

  const add = useCallback(
    (node: CatalogNode) => {
      let addedId = "";
      setGraph((current) => {
        const added = addNode(current, node, nextNodePosition(current));
        addedId = added.id;
        return added.graph;
      });
      if (addedId) setSelectedId(addedId);
    },
    [setGraph],
  );

  const remove = useCallback(
    (nodeId: string) => {
      setGraph((current) => removeNodes(current, [nodeId]));
      setSelectedId(null);
    },
    [setGraph],
  );

  return {
    nodes,
    edges: elements.edges,
    selectedId,
    select: setSelectedId,
    onNodesChange,
    onEdgesChange,
    onConnect,
    add,
    remove,
  };
};
