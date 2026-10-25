import { API_URL, apiRequest } from "@/app/api/api-request";
import type { ImageDetails } from "../domain/types";

export const getImage = (id: string) =>
  apiRequest<ImageDetails>(`/images/${id}`);

export const renderUrl = (id: string, version: number) =>
  `${API_URL}/images/${id}/render.png?maxSize=1600&v=${version}`;
