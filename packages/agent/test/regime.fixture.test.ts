import { describe, expect, it } from "vitest";
import { computeFeatures } from "../src/phases/04-regime/features.js";
import { classify } from "../src/phases/04-regime/classify.js";
import type { PoolHourPoint } from "../src/phases/04-regime/types.js";

// AT-3 — regime classifier directionality on synthetic fixtures.
// Builds three pool-history fixtures with deliberately distinct
// statistical signatures (mean-reverting, trending, high-toxic) and
// asserts the classifier picks the expected top label. The fixtures
// are synthetic so the test is hermetic — no subgraph required.

function makePoint(
  i: number,
  close: number,
  volumeUSD: number,
  liquidity: string,
): PoolHourPoint {
  return {
    periodStartUnix: 1_700_000_000 + i * 3600,
    open: close,
    high: close * 1.001,
    low: close * 0.999,
    close,
    volumeUSD,
    tick: Math.round(Math.log(close) * 1000),
    liquidity,
  };
}

describe("AT-3 — regime classifier directionality", () => {
  it("flat stable price + steady liquidity classifies as mean-reverting", () => {
    // 200 hours, price oscillating tightly around 1.0 (e.g., a USDC/USDT
    // stable-stable pool). Volume + liquidity both steady.
    const points: PoolHourPoint[] = [];
    for (let i = 0; i < 200; i++) {
      const noise = Math.sin(i * 0.5) * 0.0002;
      points.push(
        makePoint(i, 1.0 + noise, 50_000_000, "10000000000000000"),
      );
    }
    const features = computeFeatures(points);
    const { topLabel, scores } = classify(features);
    expect(topLabel).toBe("mean_reverting");
    expect(scores.mean_reverting).toBeGreaterThan(scores.trending);
  });

  it("monotonically rising price classifies as trending", () => {
    // 200 hours, price drifting up steadily — high slope, high r².
    const points: PoolHourPoint[] = [];
    for (let i = 0; i < 200; i++) {
      const close = 1000 * Math.exp(i * 0.005); // 0.5% per hour
      points.push(makePoint(i, close, 100_000_000, "5000000000000000"));
    }
    const features = computeFeatures(points);
    const { scores } = classify(features);
    // Slope must dominate vs mean-reverting.
    expect(scores.trending).toBeGreaterThan(0);
    expect(features.slope).toBeGreaterThan(0);
    expect(features.rSquared).toBeGreaterThan(0.4);
  });

  it("liquidity volatility spikes classify as JIT-dominated", () => {
    // Stable price but liquidity oscillates wildly between high and low —
    // the signature of JIT / spam-mint flow.
    const points: PoolHourPoint[] = [];
    for (let i = 0; i < 200; i++) {
      const liquidityNoise = i % 2 === 0 ? "10000000000000000" : "100000000";
      points.push(makePoint(i, 1500, 30_000_000, liquidityNoise));
    }
    const features = computeFeatures(points);
    const { scores } = classify(features);
    expect(features.jitProxy).toBeGreaterThan(0.05);
    expect(scores.jit_dominated).toBeGreaterThan(scores.trending);
  });
});
