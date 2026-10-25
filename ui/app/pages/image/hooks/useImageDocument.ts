import { useLiveVersion } from "@/app/hooks/useLiveVersion";
import { useLoad } from "@/app/hooks/useLoad";
import { getImage } from "../api/image-api";

/** An image document that refreshes itself whenever it is edited. */
export const useImageDocument = (id: string) => {
  const live = useLiveVersion(`/images/${id}/events`);
  return useLoad(() => getImage(id), `${id}:${live}`);
};
