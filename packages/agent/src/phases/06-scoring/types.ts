// Phase 6 — V4 Hook Scoring (heuristic).
// Counterfactual simulation that scores each candidate v4 hook against
// the pool's recent history with family-conditional multipliers, and
// returns simulated 30-day APR, fee capture, IL impact, and delta vs
// the current (hookless) baseline.
//
// This is EMULATED — not a chain-state replay. Each family is modeled
// by a small set of heuristic multipliers gated on the volatility +
// toxicity regime of the pool (phase 4 features). The multipliers are
// informed by hook design intent, not measured against an empirical
// backtest dataset. The agent emits the full multiplier set in the
// result so a reviewer can audit the assumption surface.

import type { Labeled } from "@lpdoctor/core";
import type { HookFamily } from "../05-hooks/types.js";

export interface HookScoringMultipliers {
  feeApr: number;          // multiplier on baseline fee APR (1.0 = no change)
  volume: number;          // multiplier on baseline volume (lower = filtered toxic flow)
  ilImpact: number;        // multiplier on baseline IL (lower = mitigated)
  retention: number;       // fee capture retention pct (1.0 = full)
  rationale: string;       // why these multipliers, in plain English
}

export interface HookScoringResult {
  hookAddress: string;
  family: HookFamily;
  baselineAprPct: number;
  simulatedAprPct: number;
  deltaAprPct: number;
  baselineIlPct: number;
  simulatedIlPct: number;
  deltaIlPct: number;
  feeCapturePct: number;
  multipliers: HookScoringMultipliers;
  hoursScored: number;
  warnings: string[];
}

export interface Phase6Output {
  result: Labeled<HookScoringResult>;
}
