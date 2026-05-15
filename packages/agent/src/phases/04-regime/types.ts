// Phase 4 — Regime classification.
// Heuristics over the pool's hourly history to label volatility regime.
// Always ESTIMATED — these are scores, not facts. The agent surfaces a
// confidence per label so the UI can render uncertainty appropriately.

import type { Labeled } from "@lpdoctor/core";

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

export type RegimeLabel =
  | "mean_reverting"
  | "trending"
  | "high_toxic"
  | "jit_dominated";

export interface RegimeFeatures {
  volRealized: number;       // annualized stdev of hourly log returns
  hurst: number;              // ~0.5 random, <0.5 mean-reverting, >0.5 trending
  slope: number;              // linreg slope on log(close)
  rSquared: number;           // goodness of fit for slope
  toxicityProxy: number;      // very rough — high-volume / depth ratio
  jitProxy: number;           // placeholder until v3 mint/burn corr lands
  hoursAnalyzed: number;
}

export interface RegimeScores {
  mean_reverting: number;
  trending: number;
  high_toxic: number;
  jit_dominated: number;
}

export interface Phase4Output {
  features: Labeled<RegimeFeatures>;
  scores: Labeled<RegimeScores>;
  topLabel: Labeled<RegimeLabel>;
  confidence: Labeled<number>;
  narrative: string;
}
