import { ReactFlowProvider } from "@xyflow/react";
import { memo, useEffect, useMemo } from "react";
import { useParams } from "react-router";

import { Alert } from "@/ui/components/primitives/alert";
import { Spinner } from "@/ui/components/primitives/spinner";
import { Toasts } from "@/app/components/Toasts";
import { useToasts } from "@/app/hooks/useToasts";
import { EditorSidePanel } from "./components/EditorSidePanel";
import { EditorTopBar } from "./components/EditorTopBar";
import { FlowCanvas } from "./components/FlowCanvas";
import { NodePalette } from "./components/NodePalette";
import type { Workflow } from "./api/editor-api";
import { groupIssues } from "./domain/group-issues";
import { updateConfig } from "./domain/graph-ops";
import { useCatalog } from "@/app/flow/hooks/useCatalog";
import { useEditorActions } from "./hooks/useEditorActions";
import { useFlowCanvas } from "./hooks/useFlowCanvas";
import { useTrigger } from "./hooks/useTrigger";
import { useWorkflowDraft } from "./hooks/useWorkflowDraft";

export function meta() {
  return [{ title: "Relay" }];
}

const Editor = memo(() => {
  const { id = "" } = useParams();
  const draft = useWorkflowDraft(id);
  const catalog = useCatalog();
  const error = draft.loadError ?? catalog.error;

  if (error) {
    return (
      <main className="p-8">
        <Alert variant="danger">{error}</Alert>
      </main>
    );
  }
  if (!draft.workflow || !catalog.nodes.length) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center">
        <Spinner size="lg" />
      </main>
    );
  }
  return (
    <ReactFlowProvider>
      <EditorLoaded
        id={id}
        workflow={draft.workflow}
        draft={draft}
        catalog={catalog}
      />
    </ReactFlowProvider>
  );
});

Editor.displayName = "Editor";

type EditorLoadedProps = {
  id: string;
  workflow: Workflow;
  draft: ReturnType<typeof useWorkflowDraft>;
  catalog: ReturnType<typeof useCatalog>;
};

const EditorLoaded = memo(
  ({ id, workflow, draft, catalog }: EditorLoadedProps) => {
    const toasts = useToasts();
    const { trigger, reload } = useTrigger(id);
    const actions = useEditorActions(id, draft, reload, toasts);
    const graph = workflow.draftGraph;
    const { clearIssues } = actions;
    // Issues describe the last publish attempt; any edit makes them stale.
    useEffect(clearIssues, [graph, clearIssues]);
    const grouped = useMemo(
      () => groupIssues(actions.issues, graph),
      [actions.issues, graph],
    );
    const canvas = useFlowCanvas(
      graph,
      draft.setGraph,
      catalog.byType,
      grouped.byNode,
    );
    const hasTrigger = graph.nodes.some(
      (node) => catalog.byType.get(node.type)?.kind === "trigger",
    );

    return (
      <main className="flex h-[100dvh] flex-col bg-(--color-bg) text-(--color-text)">
        <EditorTopBar
          workflowId={id}
          name={workflow.name}
          latestVersion={workflow.latestVersion}
          saveState={draft.saveState}
          publishing={actions.publishing}
          running={actions.running}
          onRename={draft.rename}
          onPublish={() => void actions.publish()}
          onRun={() => void actions.run()}
        />
        <div className="grid min-h-0 flex-1 grid-cols-[240px_1fr_340px]">
          <aside className="overflow-y-auto border-r border-(--color-border)">
            <NodePalette
              nodes={catalog.nodes}
              hasTrigger={hasTrigger}
              onAdd={canvas.add}
            />
          </aside>
          <FlowCanvas
            nodes={canvas.nodes}
            edges={canvas.edges}
            onNodesChange={canvas.onNodesChange}
            onEdgesChange={canvas.onEdgesChange}
            onConnect={canvas.onConnect}
            onBackgroundClick={() => canvas.select(null)}
          />
          <aside className="overflow-y-auto border-l border-(--color-border)">
            <EditorSidePanel
              graph={graph}
              catalog={catalog.byType}
              selectedId={canvas.selectedId}
              grouped={grouped}
              trigger={trigger}
              published={workflow.latestVersion !== null}
              onSelect={canvas.select}
              onConfigChange={(nodeId, config) =>
                draft.setGraph((current) =>
                  updateConfig(current, nodeId, config),
                )
              }
              onRemove={canvas.remove}
            />
          </aside>
        </div>
        <Toasts toasts={toasts.toasts} onDismiss={toasts.dismiss} />
      </main>
    );
  },
);

EditorLoaded.displayName = "EditorLoaded";

export default Editor;
