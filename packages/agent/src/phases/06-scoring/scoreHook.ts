import type { HookCandidate, HookFamily } from "../05-hooks/types.js";
import type { PoolHourPoint, RegimeFeatures } from "../04-regime/types.js";
import type { HookScoringMultipliers, HookScoringResult } from "./types.js";

// Family-conditional multipliers. The feeApr / volume / ilImpact /
// retention values are heuristic family weights informed by the
// design intent of each hook category (dynamic-fee, gated-swap,
// swap-delta-cut, royalty, init-gate, lifecycle) and gated by the
// pool's regime features (realized vol, toxicity proxy). They are
// NOT calibrated against a measured backtest dataset — readers
// should treat the simulated APR as a directional estimate informed
// by hook semantics, not a number to bet against. A full empirical
// calibration is documented in the AT-2 follow-up.

function multipliersFor(
  family: HookFamily,
  features: RegimeFeatures,
): HookScoringMultipliers {
  const elevatedVol = features.volRealized > 0.04;
  const toxic = features.toxicityProxy > 0.6;

  switch (family) {
    case "DYNAMIC_FEE_ADVANCED":
      return {
        feeApr: elevatedVol ? 1.42 : 1.18,
        volume: elevatedVol ? 0.86 : 0.94,
        ilImpact: 0.92,
        retention: 0.96,
        rationale: elevatedVol
          ? "Volatility regime is elevated (σ > 4%). Adaptive fee tier captures more of the swap toxicity at the cost of ~14% volume."
          : "Stable regime. Adaptive fee tier scales modestly with realized vol; small fee uplift, light volume cost.",
      };
    case "SWAP_DELTA_CUT":
      return {
        feeApr: 1.06,
        volume: 1.10,
        ilImpact: 1.03,
        retention: 0.98,
        rationale:
          "Swap-delta cut returns a slice of swap output to LPs. Higher gross volume, marginally higher IL since price impact is partially absorbed.",
      };
    case "MEMECOIN_ROYALTY":
      return {
        feeApr: 1.15,
        volume: 0.92,
        ilImpact: 0.95,
        retention: 1.0,
        rationale:
          "Royalty stream from each swap returns 1% to LPs. Volume drops slightly under the surcharge but net APR is up.",
      };
    case "GATED_SWAP":
      return {
        feeApr: 1.18,
        volume: 0.74,
        ilImpact: toxic ? 0.78 : 0.88,
        retention: 0.95,
        rationale: toxic
          ? "Toxic flow signal high. Whitelist gate filters arbitrage swarms; volume drops 26% but IL drops 22%, net APR up."
          : "Whitelist gate has milder impact in non-toxic regimes; some retail volume loss without strong IL benefit.",
      };
    case "INIT_GATE":
      return {
        feeApr: 1.0,
        volume: 1.0,
        ilImpact: 1.0,
        retention: 1.0,
        rationale:
          "Init gates fire only at pool initialization; no steady-state effect on running LP performance.",
      };
    case "CUSTOM_LIFECYCLE":
      return {
        feeApr: 1.0,
        volume: 1.0,
        ilImpact: 1.0,
        retention: 1.0,
        rationale:
          "Custom lifecycle hooks vary by implementation; not modeled by the generic scoring engine.",
      };
    case "UNKNOWN":
    default:
      return {
        feeApr: 1.0,
        volume: 1.0,
        ilImpact: 1.0,
        retention: 1.0,
        rationale:
          "Unknown hook family — scoring engine returns the baseline pass-through.",
      };
  }
}

// Computes baseline 30-day fee APR from hourly volume + tier — same
// formula used by Uniswap Info: fee_apr = (sum_volume × fee_tier) /
// avg_tvl × (365 / period_days). For the demo we approximate avg_tvl
// from the most recent point's liquidity pre-multiplied by sqrtPrice
// when available — the absolute number is less important than the
// delta vs baseline that the panel surfaces.
function estimateBaselineApr(
  points: PoolHourPoint[],
  feeTierPpm: number,
): number {
  if (points.length === 0) return 0;
  const totalVolumeUsd = points.reduce((acc, p) => acc + p.volumeUSD, 0);
  const periodDays = points.length / 24;
  if (periodDays === 0) return 0;

  // Coarse TVL proxy — the largest hourly liquidity in the window.
  const avgLiquidity = points.reduce(
    (acc, p) => Math.max(acc, parseFloat(p.liquidity || "0")),
    0,
  );
  if (avgLiquidity === 0) return 0;

  // feeTierPpm is parts-per-million (e.g. 3000 = 0.30%).
  const feeFraction = feeTierPpm / 1_000_000;
  const periodFees = totalVolumeUsd * feeFraction;
  // Use a normalized notional so the APR has demo-friendly magnitude.
  const tvlProxy = avgLiquidity / 1e15;
  if (tvlProxy <= 0) return 0;
  const annualizationFactor = 365 / Math.max(1, periodDays);
  return (periodFees / Math.max(1, tvlProxy)) * annualizationFactor * 100;
}

export function scoreHook(args: {
  hook: HookCandidate;
  feeTierPpm: number;
  features: RegimeFeatures;
  history: PoolHourPoint[];
  baselineIlPct: number;
}): HookScoringResult {
  const warnings: string[] = [];
  if (args.history.length < 24) {
    warnings.push(
      "Scoring history < 24 hourly points — APR estimate has wide error bars.",
    );
  }

  const multipliers = multipliersFor(args.hook.family, args.features);
  const baselineApr = estimateBaselineApr(args.history, args.feeTierPpm);
  const simulatedApr =
    baselineApr * multipliers.feeApr * multipliers.retention;
  const simulatedIl = args.baselineIlPct * multipliers.ilImpact;

  return {
    hookAddress: args.hook.hookAddress,
    family: args.hook.family,
    baselineAprPct: round(baselineApr, 2),
    simulatedAprPct: round(simulatedApr, 2),
    deltaAprPct: round(simulatedApr - baselineApr, 2),
    baselineIlPct: round(args.baselineIlPct * 100, 3),
    simulatedIlPct: round(simulatedIl * 100, 3),
    deltaIlPct: round((simulatedIl - args.baselineIlPct) * 100, 3),
    feeCapturePct: round(multipliers.retention * 100, 1),
    multipliers,
    hoursScored: args.history.length,
    warnings,
  };
}

function round(n: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
}
