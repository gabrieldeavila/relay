import { apiRequest } from "@/app/api/api-request";
import type { ConnectionKind, NewConnection } from "../domain/connection-kinds";

export interface Connection {
  id: string;
  name: string;
  kind: ConnectionKind;
  /** The URL, or the command for servers Relay starts. */
  address: string;
  toolCount: number;
  refreshedAt: string;
}

export const listConnections = () => apiRequest<Connection[]>("/providers");

export const addConnection = (connection: NewConnection) =>
  apiRequest<Connection>("/providers", { method: "POST", body: connection });

export const refreshConnection = (id: string) =>
  apiRequest<Connection>(`/providers/${id}/refresh`, { method: "POST" });

export const removeConnection = (id: string) =>
  apiRequest<null>(`/providers/${id}`, { method: "DELETE" });
