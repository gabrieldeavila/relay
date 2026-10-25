import { useLiveVersion } from "@/app/hooks/useLiveVersion";
import { useLoad } from "@/app/hooks/useLoad";
import { getVideo } from "../api/video-api";

/** A video project that refreshes itself whenever it is edited. */
export const useVideoProject = (id: string) => {
  const live = useLiveVersion(`/videos/${id}/events`);
  const project = useLoad(() => getVideo(id), `${id}:${live}`);
  return { ...project, version: live };
};
