export interface EngineConfig {
  /** Off in integration tests, which drive the loop with `drain()`. */
  enabled: boolean;
  /** Steps one process runs at the same time. */
  concurrency: number;
  /** Wait between polls when the queue was empty. */
  pollMs: number;
  /** How long a claimed step stays ours without a heartbeat. */
  leaseMs: number;
  /** How often expired leases are reclaimed and wait deadlines checked. */
  maintenanceMs: number;
  /** Per-attempt limit for nodes that set none. */
  defaultTimeoutMs: number;
}

export const ENGINE_CONFIG = 'ENGINE_CONFIG';

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  enabled: true,
  concurrency: 4,
  pollMs: 500,
  leaseMs: 30_000,
  maintenanceMs: 5_000,
  defaultTimeoutMs: 60_000,
};
