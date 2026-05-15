// Phase 7 — Migration Preview.
// Calls the Uniswap Trading API to quote a representative swap that would
// happen during a hypothetical migration of the user's V3 position into a
// candidate V4 hook. We never execute the swap — the result is EMULATED.

import type { Labeled } from "@lpdoctor/core";

export interface MigrationStep {
  kind: "close" | "swap" | "mint";
  description: string;
  detail?: Record<string, string>;
}

export interface MigrationPreview {
  fromVersion: 3;
  targetHook?: {
    address: string;
    family: string;
    poolId: string;
  };
  steps: MigrationStep[];
  swapQuote?: {
    routing: string;
    amountIn: string;
    amountOut: string;
    priceImpact: number;
    slippageTolerance: number;
    gasFeeUsd: string;
    routeKinds: string[];
  };
  warnings: string[];
}

export interface Phase7Output {
  preview: Labeled<MigrationPreview>;
}
