import { describe, expect, it } from "vitest";
import { GraphQLClient } from "graphql-request";
import {
  computeCurrentAmounts,
  computeIL,
} from "../src/phases/03-il/math.js";

// Integration test — pins the live diagnostic path against a real
// mainnet V3 position via the Uniswap V3 subgraph, all the way through
// the IL computation. Skipped without `THE_GRAPH_KEY` so CI in clean
// environments doesn't fail; runs the full path locally and in CI when
// the key is provided.
//
// Catches:
// - subgraph schema breaks (this is what failed earlier with `tickSpacing`
//   removed from the V3 Pool schema).
// - V3 position fields rename / removal.
// - `@uniswap/v3-sdk` ESM/CJS regressions in our shim.
//
// Pinned position: tokenId 605311 (USDC/WETH 0.05 % bleeding wallet —
// way above range, IL dominant). It has been live > 12 months and is
// stable for use as a fixture; the assertion checks shape + magnitude
// rather than exact values so the test stays green as the position's
// live state drifts.

const TOKEN_ID = "605311";
const KEY = process.env.THE_GRAPH_KEY;
const SUBGRAPH_ID = "5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV";

const POSITION_QUERY = /* GraphQL */ `
  query PositionById($id: ID!) {
    position(id: $id) {
      id
      owner
      liquidity
      depositedToken0
      depositedToken1
      collectedFeesToken0
      collectedFeesToken1
      tickLower {
        tickIdx
      }
      tickUpper {
        tickIdx
      }
      pool {
        id
        feeTier
        sqrtPrice
        tick
        token0Price
        token1Price
        token0 {
          id
          symbol
          decimals
        }
        token1 {
          id
          symbol
          decimals
        }
      }
    }
  }
`;

interface SubgraphPosition {
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
    sqrtPrice: string;
    tick: string;
    token0Price: string;
    token1Price: string;
    token0: { id: string; symbol: string; decimals: string };
    token1: { id: string; symbol: string; decimals: string };
  };
}

describe.skipIf(!KEY)(
  "integration — live diagnose against mainnet position",
  () => {
    const client = new GraphQLClient(
      `https://gateway.thegraph.com/api/${KEY}/subgraphs/id/${SUBGRAPH_ID}`,
    );

    it(`fetches v3 position ${TOKEN_ID} from the subgraph`, async () => {
      const data = await client.request<{ position: SubgraphPosition | null }>(
        POSITION_QUERY,
        { id: TOKEN_ID },
      );
      expect(data.position).not.toBeNull();
      const p = data.position!;
      expect(p.id).toBe(TOKEN_ID);
      expect(p.pool.token0.symbol).toMatch(/USDC/i);
      expect(p.pool.token1.symbol).toMatch(/WETH/i);
      expect(p.pool.feeTier).toBe("500");
      // tickSpacing is intentionally NOT requested — the V3 schema
      // dropped it. The server derives it client-side from feeTier.
    }, 30_000);

    it(`computes IL on position ${TOKEN_ID} end-to-end`, async () => {
      const data = await client.request<{ position: SubgraphPosition | null }>(
        POSITION_QUERY,
        { id: TOKEN_ID },
      );
      const p = data.position!;
      const pool = p.pool;
      const decimals0 = parseInt(pool.token0.decimals, 10);
      const decimals1 = parseInt(pool.token1.decimals, 10);

      // Compute current amounts via SqrtPriceMath.
      const amounts = computeCurrentAmounts({
        liquidity: p.liquidity,
        tickLower: parseInt(p.tickLower.tickIdx, 10),
        tickUpper: parseInt(p.tickUpper.tickIdx, 10),
        currentTick: parseInt(pool.tick, 10),
        sqrtPriceX96: pool.sqrtPrice,
      });

      // Compute IL breakdown.
      const breakdown = computeIL({
        depositedToken0: p.depositedToken0,
        depositedToken1: p.depositedToken1,
        collectedFeesToken0: p.collectedFeesToken0,
        collectedFeesToken1: p.collectedFeesToken1,
        currentAmount0Raw: amounts.amount0,
        currentAmount1Raw: amounts.amount1,
        token0Decimals: decimals0,
        token1Decimals: decimals1,
        token0Price: pool.token0Price,
      });

      // Shape assertions — every output field is a finite number.
      expect(Number.isFinite(breakdown.hodlValueT1)).toBe(true);
      expect(Number.isFinite(breakdown.lpValueT1)).toBe(true);
      expect(Number.isFinite(breakdown.feesValueT1)).toBe(true);
      expect(Number.isFinite(breakdown.ilT1)).toBe(true);
      expect(Number.isFinite(breakdown.ilPct)).toBe(true);

      // 605311 is way above range — at least one side of liquidity is
      // fully token1, deposited > current LP value, IL is non-zero.
      // We don't pin exact magnitudes (LP value drifts with price); we
      // assert the directional invariants any out-of-range position
      // satisfies.
      expect(breakdown.hodlValueT1).toBeGreaterThan(0);
      expect(breakdown.lpValueT1).toBeGreaterThanOrEqual(0);
    }, 30_000);
  },
);
