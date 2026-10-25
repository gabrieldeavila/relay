import { memo } from "react";
import { useTranslation } from "react-i18next";
import { FiEyeOff } from "react-icons/fi";

import { cn } from "@/ui/helpers/cn";
import { layersTopFirst, layerSummary } from "../domain/layer-summary";
import type { Layer } from "../domain/types";
import { SidePanel } from "./SidePanel";

type LayersPanelProps = { layers: Layer[]; activeLayerId: string };

export const LayersPanel = memo(
  ({ layers, activeLayerId }: LayersPanelProps) => {
    const { t } = useTranslation("image");

    return (
      <SidePanel title={t("layers")}>
        <ul className="flex flex-col gap-1">
          {layersTopFirst(layers).map((layer) => (
            <li
              key={layer.id}
              className={cn(
                "flex items-center gap-2 rounded-(--radius-sm) px-2 py-1.5 text-sm",
                layer.id === activeLayerId && "bg-(--color-surface-3)",
                !layer.visible && "text-(--color-text-muted)",
              )}
            >
              <span className="min-w-0 flex-1 truncate">{layer.name}</span>
              <span className="text-xs text-(--color-text-muted)">
                {layerSummary(layer)}
              </span>
              {!layer.visible && <FiEyeOff aria-label={t("hidden")} />}
            </li>
          ))}
        </ul>
      </SidePanel>
    );
  },
);

LayersPanel.displayName = "LayersPanel";
