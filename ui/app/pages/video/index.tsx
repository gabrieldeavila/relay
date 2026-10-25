import { memo } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";

import { Alert } from "@/ui/components/primitives/alert";
import { Spinner } from "@/ui/components/primitives/spinner";
import { PageHeader } from "@/app/components/PageHeader";
import { formatSeconds } from "@/app/format/format-seconds";
import { ExportPanel } from "./components/ExportPanel";
import { FramePreview } from "./components/FramePreview";
import { Timeline } from "./components/Timeline";
import { usePlayhead } from "./hooks/usePlayhead";
import { useVideoProject } from "./hooks/useVideoProject";

export function meta() {
  return [{ title: "Relay · Video" }];
}

const VideoPage = memo(() => {
  const { t } = useTranslation("video");
  const { id = "" } = useParams();
  const { data: video, error, version } = useVideoProject(id);
  const playhead = usePlayhead(video?.durationSeconds ?? 0);

  return (
    <main className="min-h-[100dvh] bg-(--color-bg) text-(--color-text)">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
        <PageHeader
          title={video?.name ?? t("title")}
          subtitle={
            video
              ? `${video.width}×${video.height} · ${video.fps} fps · ${formatSeconds(video.durationSeconds)}`
              : undefined
          }
        />
        {error && <Alert variant="danger">{error}</Alert>}
        {!video && !error && (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}
        {video && (
          <>
            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              <FramePreview
                id={video.id}
                time={playhead.time}
                version={version}
                width={video.width}
                height={video.height}
                isEmpty={video.durationSeconds === 0}
              />
              <ExportPanel exported={video.latestExport} />
            </div>
            <Timeline
              clips={video.clipsByLayer}
              duration={video.durationSeconds}
              time={playhead.time}
              onSeek={playhead.setTime}
            />
          </>
        )}
      </div>
    </main>
  );
});

VideoPage.displayName = "VideoPage";

export default VideoPage;
