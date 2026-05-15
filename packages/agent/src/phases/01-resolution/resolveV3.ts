import { verified } from "@lpdoctor/core";
import type { Phase1Output, Phase1Pool } from "./types.js";

export interface V3SubgraphPosition {
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
    sqrtPrice: string;
    tick: string;
    token0Price: string;
    token1Price: string;
    token0: { id: string; symbol: string; decimals: string };
    token1: { id: string; symbol: string; decimals: string };
  };
}

export type V3PositionFetcher = (
  tokenId: string,
) => Promise<V3SubgraphPosition | null>;

export async function resolveV3Position(
  tokenId: string,
  fetcher: V3PositionFetcher,
): Promise<Phase1Output> {
  const raw = await fetcher(tokenId);
  if (!raw) {
    throw new Error(`v3 position ${tokenId} not found in subgraph`);
  }

  const pool: Phase1Pool = {
    address: raw.pool.id,
    feeTier: parseInt(raw.pool.feeTier, 10),
    tickSpacing: parseInt(raw.pool.tickSpacing, 10),
    sqrtPriceX96: raw.pool.sqrtPrice,
    tick: parseInt(raw.pool.tick, 10),
    token0Price: raw.pool.token0Price,
    token1Price: raw.pool.token1Price,
    token0: {
      address: raw.pool.token0.id,
      symbol: raw.pool.token0.symbol,
      decimals: parseInt(raw.pool.token0.decimals, 10),
    },
    token1: {
      address: raw.pool.token1.id,
      symbol: raw.pool.token1.symbol,
      decimals: parseInt(raw.pool.token1.decimals, 10),
    },
  };

  return {
    tokenId,
    version: 3,
    owner: verified(raw.owner, "uniswap-v3-subgraph"),
    pool: verified(pool, "uniswap-v3-subgraph"),
    tickLower: verified(parseInt(raw.tickLower.tickIdx, 10), "uniswap-v3-subgraph"),
    tickUpper: verified(parseInt(raw.tickUpper.tickIdx, 10), "uniswap-v3-subgraph"),
    liquidity: verified(raw.liquidity, "uniswap-v3-subgraph"),
    depositedToken0: verified(raw.depositedToken0, "uniswap-v3-subgraph"),
    depositedToken1: verified(raw.depositedToken1, "uniswap-v3-subgraph"),
    collectedFeesToken0: verified(raw.collectedFeesToken0, "uniswap-v3-subgraph"),
    collectedFeesToken1: verified(raw.collectedFeesToken1, "uniswap-v3-subgraph"),
  };
}
