import { useEffect, useState } from "react";

import { API_URL } from "../api/api-request";

/**
 * A number that changes every time the API reports an edit on `path`
 * (an SSE stream such as `/images/:id/events`), so pages can refetch.
 */
export const useLiveVersion = (path: string) => {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const events = new EventSource(`${API_URL}${path}`);
    events.onmessage = () => setVersion((current) => current + 1);
    return () => events.close();
  }, [path]);

  return version;
};
