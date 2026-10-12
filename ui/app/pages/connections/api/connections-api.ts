import { apiRequest } from "@/app/api/api-request";

export interface Connection {
  id: string;
  name: string;
  baseUrl: string;
  toolCount: number;
  refreshedAt: string;
}

export const listConnections = () => apiRequest<Connection[]>("/providers");

export const addConnection = (name: string, baseUrl: string) =>
  apiRequest<Connection>("/providers", {
    method: "POST",
    body: { name, baseUrl },
  });

export const refreshConnection = (id: string) =>
  apiRequest<Connection>(`/providers/${id}/refresh`, { method: "POST" });

export const removeConnection = (id: string) =>
  apiRequest<null>(`/providers/${id}`, { method: "DELETE" });
