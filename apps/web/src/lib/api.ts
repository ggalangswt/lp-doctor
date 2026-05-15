// Typed fetch wrapper for the LPDoctor server. The vite dev server proxies
// /api and /health to the configured backend base URL — see
// apps/web/vite.config.ts.

export interface V3PositionRaw {
  id: string;
  owner: string;
  liquidity: string;
  depositedToken0: string;
  depositedToken1: string;
  collectedFeesToken0: string;
  collectedFeesToken1: string;
  tickLower: { tickIdx: string };
  tickUpper: { tickIdx: string };
  pool: {
    id: string;
    feeTier: string;
    tickSpacing: string;
    /** Current pool tick — used by classifyHealth to detect out-of-range
     *  positions. Nullable when the subgraph hasn't indexed any swaps yet. */
    tick: string | null;
    token0: { id: string; symbol: string; decimals: string };
    token1: { id: string; symbol: string; decimals: string };
  };
}

export interface PositionsResponse {
  address: string;
  version: number;
  positions: V3PositionRaw[];
}

export interface HealthResponse {
  status: string;
  service: string;
  env: string;
  subgraph: "ready" | "no-api-key";
}

export async function fetchPositions(
  address: string,
): Promise<PositionsResponse> {
  const r = await fetch(`/api/positions/${address}`);
  if (!r.ok) throw new Error(`positions ${r.status}`);
  return r.json();
}

export async function fetchHealth(): Promise<HealthResponse> {
  const r = await fetch("/health");
  if (!r.ok) throw new Error(`health ${r.status}`);
  return r.json();
}
