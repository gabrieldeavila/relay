import { useEffect, useState } from "react";

import { useLoad } from "@/app/hooks/useLoad";
import { listImages, listVideos } from "../api/studio-api";

/** Checked this often, so projects an AI creates over MCP show up on their own. */
const REFRESH_MS = 4000;

/** Image documents and video projects, kept fresh while the page is open. */
export const useStudioLists = () => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((value) => value + 1), REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  const images = useLoad(listImages, tick);
  const videos = useLoad(listVideos, tick);
  return { images, videos };
};
