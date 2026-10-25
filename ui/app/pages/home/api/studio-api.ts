import { API_URL, apiRequest } from "@/app/api/api-request";
import type { ImageSummary, VideoSummary } from "../domain/types";

export const listImages = () => apiRequest<ImageSummary[]>("/images");

export const listVideos = () => apiRequest<VideoSummary[]>("/videos");

/** `updatedAt` busts the cache so the thumbnail follows edits. */
export const imageThumbnailUrl = (image: ImageSummary) =>
  `${API_URL}/images/${image.id}/render.png?maxSize=480&v=${image.updatedAt}`;

export const videoThumbnailUrl = (video: VideoSummary) =>
  `${API_URL}/videos/${video.id}/frame.png?t=0&v=${video.updatedAt}`;

export const mcpUrl = () => `${API_URL}/mcp`;
