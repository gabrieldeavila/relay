import { useEffect, useMemo, useState } from "react";

import { fetchCatalog } from "../api/catalog-api";
import type { CatalogNode } from "../domain/types";

/** Node types the palette offers, and lookups by type. */
export const useCatalog = () => {
  const [nodes, setNodes] = useState<CatalogNode[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCatalog().then(setNodes, (loadError: Error) =>
      setError(loadError.message),
    );
  }, []);

  const byType = useMemo(
    () => new Map(nodes.map((node) => [node.type, node])),
    [nodes],
  );
  return { nodes, byType, error };
};
