import { memo } from "react";

import { renderUrl } from "../api/image-api";

type ImageCanvasProps = { id: string; version: number; name: string };

/** The current render, over a checkerboard so transparency shows. */
export const ImageCanvas = memo(({ id, version, name }: ImageCanvasProps) => (
  <div className="flex min-h-[60dvh] items-center justify-center rounded-(--radius-md) border border-(--color-border) bg-(--color-bg) p-4">
    <img
      src={renderUrl(id, version)}
      alt={name}
      className="max-h-[75dvh] max-w-full object-contain shadow-(--shadow-md)"
      style={{
        backgroundImage:
          "repeating-conic-gradient(#2a2e3a 0% 25%, #1c2030 0% 50%)",
        backgroundSize: "20px 20px",
      }}
    />
  </div>
));

ImageCanvas.displayName = "ImageCanvas";
