import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";

import { Alert } from "@/ui/components/primitives/alert";
import { Spinner } from "@/ui/components/primitives/spinner";
import { PageHeader } from "@/app/components/PageHeader";
import { HistoryPanel } from "./components/HistoryPanel";
import { ImageCanvas } from "./components/ImageCanvas";
import { LayersPanel } from "./components/LayersPanel";
import { useImageDocument } from "./hooks/useImageDocument";

export function meta() {
  return [{ title: "Relay · Image" }];
}

const ImagePage = memo(() => {
  const { t } = useTranslation("image");
  const { id = "" } = useParams();
  const { data: image, error } = useImageDocument(id);

  return (
    <main className="min-h-[100dvh] bg-(--color-bg) text-(--color-text)">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
        <PageHeader
          title={image?.name ?? t("title")}
          subtitle={image ? `${image.width}×${image.height}` : undefined}
        />
        {error && <Alert variant="danger">{error}</Alert>}
        {!image && !error && (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}
        {image && (
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <ImageCanvas
              id={image.id}
              version={image.version}
              name={image.name}
            />
            <div className="flex flex-col gap-4">
              <LayersPanel
                layers={image.layersBottomToTop}
                activeLayerId={image.activeLayerId}
              />
              <HistoryPanel edits={image.recentEdits} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
});

ImagePage.displayName = "ImagePage";

export default ImagePage;
