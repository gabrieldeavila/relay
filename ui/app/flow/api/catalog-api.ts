import { apiRequest } from "@/app/api/api-request";
import type { CatalogNode } from "../domain/types";

export const fetchCatalog = () => apiRequest<CatalogNode[]>("/nodes");
