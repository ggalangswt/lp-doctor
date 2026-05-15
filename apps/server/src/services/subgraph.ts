import { GraphQLClient } from "graphql-request";
import { config } from "../config.js";
import { logger } from "../logger.js";
import type { V3SubgraphPosition } from "@lpdoctor/agent";

const GATEWAY = "https://gateway.thegraph.com/api";

function buildV3Endpoint(): string | null {
  if (!config.THE_GRAPH_KEY) return null;
  const id = "5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV";
  return `${GATEWAY}/${config.THE_GRAPH_KEY}/subgraphs/id/${id}`;
}

function buildV4Endpoint(): string | null {
  if (!config.THE_GRAPH_KEY) return null;
  const id = "DiYPVdygkfjDWhbxGSqAQxwBKmfKnkWQojqeM2rkLb3G";
  return `${GATEWAY}/${config.THE_GRAPH_KEY}/subgraphs/id/${id}`;
}

const POSITIONS_BY_OWNER_V3 = /* GraphQL */ `
  query PositionsByOwner($owner: Bytes!) {
    positions(
      where: { owner: $owner, liquidity_gt: "0" }
      first: 100
      orderBy: transaction__timestamp
      orderDirection: desc
    ) {
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
        tick
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

const POSITION_BY_ID_V3 = /* GraphQL */ `
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

// V3 pool tickSpacing is fully determined by the fee tier (per
// Uniswap factory's `feeAmountTickSpacing` mapping). The subgraph
// schema does not expose it, so we derive it client-side.
const V3_FEE_TIER_TO_TICK_SPACING: Record<string, number> = {
  "100": 1,
  "500": 10,
  "3000": 60,
  "10000": 200,
};

function deriveV3TickSpacing(feeTier: string): string {
  const ts = V3_FEE_TIER_TO_TICK_SPACING[feeTier];
  if (ts !== undefined) return String(ts);
  // Fallback for non-standard tiers — Uniswap factory defaults are
  // power-of-2 friendly; use 60 (the most common) as a safe default.
  return "60";
}

const POOL_HOUR_DATAS_V3 = /* GraphQL */ `
  query PoolHourDatas($pool: ID!, $from: Int!) {
    poolHourDatas(
      where: { pool: $pool, periodStartUnix_gte: $from }
      first: 720
      orderBy: periodStartUnix
      orderDirection: asc
    ) {
      periodStartUnix
      open
      high
      low
      close
      volumeUSD
      tick
      liquidity
    }
  }
`;

const MODIFY_LIQUIDITIES_BY_ORIGIN_V4 = /* GraphQL */ `
  query ModifyLiquiditiesByOrigin($origin: Bytes!) {
    modifyLiquidities(
      where: { origin: $origin }
      first: 1000
      orderBy: timestamp
      orderDirection: asc
    ) {
      id
      timestamp
      amount
      amount0
      amount1
      tickLower
      tickUpper
      logIndex
      pool {
        id
        hooks
        feeTier
        tickSpacing
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

const HOOKED_POOLS_BY_PAIR_V4 = /* GraphQL */ `
  query HookedPoolsByPair($token0: String!, $token1: String!) {
    pools(
      where: {
        token0: $token0
        token1: $token1
        hooks_not: "0x0000000000000000000000000000000000000000"
        liquidity_gt: "0"
      }
      first: 50
      orderBy: totalValueLockedUSD
      orderDirection: desc
    ) {
      id
      hooks
      feeTier
      tickSpacing
      liquidity
      totalValueLockedUSD
      volumeUSD
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
`;

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
    token0: { id: string; symbol: string; decimals: string };
    token1: { id: string; symbol: string; decimals: string };
  };
}

export interface V4ModifyLiquidityRaw {
  id: string;
  timestamp: string;
  amount: string;
  amount0: string;
  amount1: string;
  tickLower: string;
  tickUpper: string;
  logIndex: string | null;
  pool: {
    id: string;
    hooks: string;
    feeTier: string;
    tickSpacing: string;
    token0: { id: string; symbol: string; decimals: string };
    token1: { id: string; symbol: string; decimals: string };
  };
}

export interface V4HookedPoolRaw {
  id: string;
  hooks: string;
  feeTier: string;
  tickSpacing: string;
  liquidity: string;
  totalValueLockedUSD: string;
  volumeUSD: string;
  token0: { id: string; symbol: string; decimals: string };
  token1: { id: string; symbol: string; decimals: string };
}

export interface PoolHourPoint {
  periodStartUnix: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volumeUSD: number;
  tick: number;
  liquidity: string;
}

interface PoolHourDataRaw {
  periodStartUnix: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volumeUSD: string;
  tick: string | null;
  liquidity: string;
}

export class SubgraphClient {
  private readonly v3: GraphQLClient | null;
  private readonly v4: GraphQLClient | null;

  constructor() {
    const v3Endpoint = buildV3Endpoint();
    const v4Endpoint = buildV4Endpoint();
    this.v3 = v3Endpoint ? new GraphQLClient(v3Endpoint) : null;
    this.v4 = v4Endpoint ? new GraphQLClient(v4Endpoint) : null;
    if (!this.v3) {
      logger.warn(
        "THE_GRAPH_KEY not set — v3 subgraph queries will return empty",
      );
    }
    if (!this.v4) {
      logger.warn(
        "THE_GRAPH_KEY not set — v4 subgraph queries will return empty",
      );
    }
  }

  isReady(): boolean {
    return this.v3 !== null;
  }

  isReadyV4(): boolean {
    return this.v4 !== null;
  }

  async getV3PositionsByOwner(owner: string): Promise<V3PositionRaw[]> {
    if (!this.v3) {
      logger.warn(
        `subgraph not configured — returning empty positions for ${owner}`,
      );
      return [];
    }
    try {
      const data = await this.v3.request<{ positions: V3PositionRaw[] }>(
        POSITIONS_BY_OWNER_V3,
        { owner: owner.toLowerCase() },
      );
      // Subgraph V3 schema does not expose Pool.tickSpacing — derive
      // from feeTier so downstream consumers (PositionCard, agent phases)
      // see a complete shape.
      return data.positions.map((p) => ({
        ...p,
        pool: { ...p.pool, tickSpacing: deriveV3TickSpacing(p.pool.feeTier) },
      }));
    } catch (err) {
      logger.error(
        `subgraph v3 getV3PositionsByOwner failed for ${owner}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      throw err;
    }
  }

  async getV3PositionById(
    tokenId: string,
  ): Promise<V3SubgraphPosition | null> {
    if (!this.v3) {
      logger.warn(
        `subgraph not configured — cannot resolve v3 position ${tokenId}`,
      );
      return null;
    }
    try {
      const data = await this.v3.request<{ position: V3SubgraphPosition | null }>(
        POSITION_BY_ID_V3,
        { id: tokenId },
      );
      if (!data.position) return null;
      // Patch tickSpacing from feeTier (not exposed by V3 subgraph).
      return {
        ...data.position,
        pool: {
          ...data.position.pool,
          tickSpacing: deriveV3TickSpacing(data.position.pool.feeTier),
        },
      };
    } catch (err) {
      logger.error(
        `subgraph v3 getV3PositionById failed for ${tokenId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      throw err;
    }
  }

  async getV3PoolHourDatas(
    poolId: string,
    fromUnix: number,
  ): Promise<PoolHourPoint[]> {
    if (!this.v3) {
      logger.warn(
        `subgraph not configured — cannot fetch hour datas for ${poolId}`,
      );
      return [];
    }
    try {
      const data = await this.v3.request<{ poolHourDatas: PoolHourDataRaw[] }>(
        POOL_HOUR_DATAS_V3,
        { pool: poolId, from: fromUnix },
      );
      return data.poolHourDatas.map((p) => ({
        periodStartUnix: parseInt(p.periodStartUnix, 10),
        open: parseFloat(p.open),
        high: parseFloat(p.high),
        low: parseFloat(p.low),
        close: parseFloat(p.close),
        volumeUSD: parseFloat(p.volumeUSD),
        tick: p.tick ? parseInt(p.tick, 10) : 0,
        liquidity: p.liquidity,
      }));
    } catch (err) {
      logger.error(
        `subgraph v3 getV3PoolHourDatas failed for ${poolId}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      throw err;
    }
  }

  async getV4ModifyLiquiditiesByOrigin(
    origin: string,
  ): Promise<V4ModifyLiquidityRaw[]> {
    if (!this.v4) {
      logger.warn(
        `subgraph not configured — returning empty v4 events for ${origin}`,
      );
      return [];
    }
    try {
      const data = await this.v4.request<{
        modifyLiquidities: V4ModifyLiquidityRaw[];
      }>(MODIFY_LIQUIDITIES_BY_ORIGIN_V4, { origin: origin.toLowerCase() });
      return data.modifyLiquidities;
    } catch (err) {
      logger.error(
        `subgraph v4 getV4ModifyLiquiditiesByOrigin failed for ${origin}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      throw err;
    }
  }

  async getV4HookedPoolsByPair(
    token0: string,
    token1: string,
  ): Promise<V4HookedPoolRaw[]> {
    if (!this.v4) {
      logger.warn(
        `subgraph not configured — returning empty v4 hooked pools for ${token0}/${token1}`,
      );
      return [];
    }
    // Token addresses on the subgraph are lower-cased and ordered token0 < token1
    // by Uniswap convention. We try the natural order first; callers can flip
    // if needed.
    try {
      const data = await this.v4.request<{ pools: V4HookedPoolRaw[] }>(
        HOOKED_POOLS_BY_PAIR_V4,
        {
          token0: token0.toLowerCase(),
          token1: token1.toLowerCase(),
        },
      );
      return data.pools;
    } catch (err) {
      logger.error(
        `subgraph v4 getV4HookedPoolsByPair failed for ${token0}/${token1}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      throw err;
    }
  }
}

export const subgraph = new SubgraphClient();
