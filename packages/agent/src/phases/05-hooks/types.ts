// Phase 5 — V4 Hook Discovery.
// Returns candidate V4 hooks compatible with the user's pair, with a
// family label inferred heuristically from the permission flag bitmap.

import type { Labeled } from "@lpdoctor/core";

export type HookFamily =
  | "DYNAMIC_FEE_ADVANCED"
  | "SWAP_DELTA_CUT"
  | "MEMECOIN_ROYALTY"
  | "GATED_SWAP"
  | "INIT_GATE"
  | "CUSTOM_LIFECYCLE"
  | "UNKNOWN";

export interface HookCandidate {
  poolId: string;
  hookAddress: string;
  family: HookFamily;
  flagsBitmap: number;
  activeFlags: string[];
  feeTier: number;
  tickSpacing: number;
  tvlUsd: number;
  volumeUsd: number;
  pair: string;
}

export interface Phase5Output {
  pair: string;
  candidates: Labeled<HookCandidate[]>;
  topFamily: Labeled<HookFamily>;
}
