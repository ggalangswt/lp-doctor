import type { V4ModifyLiquidityRaw } from "./subgraph.js";

// Aggregates raw ModifyLiquidity events into a coarse view of "open" V4
// positions for a given origin. The v4 subgraph schema does not expose the
// `salt` that disambiguates multiple positions in the same pool/range for
// the same EOA, so we group by (pool, tickLower, tickUpper) and sum signed
// `amount`. Rows where the net liquidity stays positive are surfaced as
// derived positions for the atlas.

export interface V4DerivedPosition {
  pool: V4ModifyLiquidityRaw["pool"];
  tickLower: number;
  tickUpper: number;
  netLiquidity: bigint;
  modificationCount: number;
  lastTimestamp: number;
}

function key(ev: V4ModifyLiquidityRaw): string {
  return `${ev.pool.id}|${ev.tickLower}|${ev.tickUpper}`;
}

export function deriveV4Positions(
  events: V4ModifyLiquidityRaw[],
): V4DerivedPosition[] {
  const map = new Map<string, V4DerivedPosition>();

  for (const ev of events) {
    const k = key(ev);
    const existing = map.get(k);
    const delta = BigInt(ev.amount);
    const ts = parseInt(ev.timestamp, 10);

    if (existing) {
      existing.netLiquidity += delta;
      existing.modificationCount += 1;
      if (ts > existing.lastTimestamp) existing.lastTimestamp = ts;
    } else {
      map.set(k, {
        pool: ev.pool,
        tickLower: parseInt(ev.tickLower, 10),
        tickUpper: parseInt(ev.tickUpper, 10),
        netLiquidity: delta,
        modificationCount: 1,
        lastTimestamp: ts,
      });
    }
  }

  return Array.from(map.values()).filter((p) => p.netLiquidity > 0n);
}
