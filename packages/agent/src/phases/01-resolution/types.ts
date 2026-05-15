// Phase 1 — Position Resolution.
// Reads position state from authoritative sources (subgraph for V3,
// PositionManager contract for V4). Always returns VERIFIED data — no
// estimation, no emulation. If the position cannot be resolved we throw.

import type { Labeled } from "@lpdoctor/core";

export interface Phase1Token {
  address: string;
  symbol: string;
  decimals: number;
}

export interface Phase1Pool {
  address: string;
  feeTier: number;
  tickSpacing: number;
  hooks?: string;
  token0: Phase1Token;
  token1: Phase1Token;
  // Live pool state needed for downstream phases (e.g. IL reconstruction).
  sqrtPriceX96: string;
  tick: number;
  token0Price: string;
  token1Price: string;
}

export interface Phase1Output {
  tokenId: string;
  version: 3 | 4;
  owner: Labeled<string>;
  pool: Labeled<Phase1Pool>;
  tickLower: Labeled<number>;
  tickUpper: Labeled<number>;
  liquidity: Labeled<string>;
  depositedToken0: Labeled<string>;
  depositedToken1: Labeled<string>;
  collectedFeesToken0: Labeled<string>;
  collectedFeesToken1: Labeled<string>;
}
