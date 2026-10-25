import { useEffect, useState } from "react";

/** Loads data whenever `key` changes; keeps the last result while reloading. */
export const useLoad = <T>(load: () => Promise<T>, key: unknown) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    load().then(
      (result) => {
        if (!current) return;
        setData(result);
        setError(null);
      },
      (loadError: Error) => current && setError(loadError.message),
    );
    return () => {
      current = false;
    };
    // `load` is recreated every render; `key` says when to run it again.
  }, [key]);

  return { data, error };
};
