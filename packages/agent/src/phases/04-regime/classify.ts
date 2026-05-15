import type { RegimeFeatures, RegimeLabel, RegimeScores } from "./types.js";

// Maps the raw features into [0..1] scores per regime label. Simple bounded
// thresholds — no machine learning, easy to audit. Calibration data lives in
// data/regime-classification.md (research notes).

export function classify(features: RegimeFeatures): {
  scores: RegimeScores;
  topLabel: RegimeLabel;
  confidence: number;
} {
  const scores: RegimeScores = {
    mean_reverting: 0,
    trending: 0,
    high_toxic: 0,
    jit_dominated: 0,
  };

  // Mean reverting : low Hurst + low realised vol pulls it up.
  if (features.hurst < 0.45) {
    scores.mean_reverting = clamp(1 - features.hurst / 0.5);
  }
  if (features.volRealized < 0.5) {
    scores.mean_reverting = clamp(scores.mean_reverting + 0.2);
  }

  // Trending : decisive slope with reasonable r².
  if (Math.abs(features.slope) > 0.001 && features.rSquared > 0.4) {
    scores.trending = clamp(Math.abs(features.slope) * 100);
  }

  // High toxic : crude toxicity proxy threshold.
  if (features.toxicityProxy > 0.05) {
    scores.high_toxic = clamp(features.toxicityProxy * 4);
  }

  // JIT : placeholder until mint/burn correlation lands.
  if (features.jitProxy > 0.05) {
    scores.jit_dominated = clamp(features.jitProxy * 10);
  }

  let topLabel: RegimeLabel = "mean_reverting";
  let topScore = 0;
  for (const k of Object.keys(scores) as RegimeLabel[]) {
    if (scores[k] > topScore) {
      topScore = scores[k];
      topLabel = k;
    }
  }
  return { scores, topLabel, confidence: topScore };
}

function clamp(x: number): number {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

export function describeRegime(args: {
  topLabel: RegimeLabel;
  confidence: number;
  features: RegimeFeatures;
}): string {
  const labelText: Record<RegimeLabel, string> = {
    mean_reverting: "mean-reverting",
    trending: "trending",
    high_toxic: "high-toxic flow",
    jit_dominated: "JIT-dominated",
  };
  const conf = args.confidence < 0.4 ? "low" : args.confidence < 0.7 ? "moderate" : "high";
  return `Pool regime over the last ${args.features.hoursAnalyzed}h looks ${labelText[args.topLabel]} (confidence ${conf}, vol ${(args.features.volRealized * 100).toFixed(1)}%, hurst ${args.features.hurst.toFixed(2)}).`;
}
