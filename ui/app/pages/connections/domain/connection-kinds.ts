export const CONNECTION_KINDS = ["tools_api", "mcp_http", "mcp_stdio"] as const;
export type ConnectionKind = (typeof CONNECTION_KINDS)[number];

/** What the API takes to connect an app. */
export type NewConnection =
  | { name: string; kind: "tools_api" | "mcp_http"; baseUrl: string }
  | { name: string; kind: "mcp_stdio"; command: string };

/** Pincel is the first app most people connect, so its address is the default. */
const DEFAULTS: Record<ConnectionKind, { name: string; address: string }> = {
  tools_api: { name: "Pincel", address: "http://localhost:4300" },
  mcp_http: { name: "", address: "" },
  mcp_stdio: { name: "", address: "" },
};

export const connectionDefaults = (kind: ConnectionKind) => DEFAULTS[kind];

/** True when the address is a command Relay will start, not a URL. */
export const isCommand = (kind: ConnectionKind) => kind === "mcp_stdio";

export function newConnection(
  kind: ConnectionKind,
  name: string,
  address: string,
): NewConnection {
  const trimmed = { name: name.trim(), address: address.trim() };
  return kind === "mcp_stdio"
    ? { name: trimmed.name, kind, command: trimmed.address }
    : { name: trimmed.name, kind, baseUrl: trimmed.address };
}
