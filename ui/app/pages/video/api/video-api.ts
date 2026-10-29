import { API_URL, apiRequest } from "@/app/api/api-request";
import type { VideoDetails, VideoPreview } from "../domain/types";

export const getVideo = (id: string) =>
  apiRequest<VideoDetails>(`/videos/${id}`);

export const frameUrl = (id: string, time: number, version: number) =>
  `${API_URL}/videos/${id}/frame.png?t=${time}&v=${version}`;

/** The playback preview of the current timeline; starts rendering it if needed. */
export const startPreview = (id: string) =>
  apiRequest<VideoPreview>(`/videos/${id}/preview`, { method: "POST" });
