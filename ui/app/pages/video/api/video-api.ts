import { API_URL, apiRequest } from "@/app/api/api-request";
import type { VideoDetails } from "../domain/types";

export const getVideo = (id: string) =>
  apiRequest<VideoDetails>(`/videos/${id}`);

export const frameUrl = (id: string, time: number, version: number) =>
  `${API_URL}/videos/${id}/frame.png?t=${time}&v=${version}`;
