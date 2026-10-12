import { useEffect, useState } from "react";

import { authHeaders } from "@/app/api/api-request";

/** Run files need the login token, which <img src> cannot send: fetch as a blob. */
export const useAuthorizedImage = (url: string) => {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(url, { headers: await authHeaders() });
        if (!response.ok) throw new Error(String(response.status));
        objectUrl = URL.createObjectURL(await response.blob());
        if (!cancelled) setSrc(objectUrl);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return { src, failed };
};
