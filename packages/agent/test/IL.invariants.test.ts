import { describe, expect, it } from "vitest";
import {
  computeCurrentAmounts,
  computeIL,
} from "../src/phases/03-il/math.js";

// AT-1 — IL invariants. Three properties of the IL math that have to
// hold regardless of pool / regime. If any of these break, every
// downstream `COMPUTED` label in the report is wrong.

const SQRT_PRICE_X96_AT_TICK_0 = "79228162514264337593543950336"; // 2^96

describe("phase 3 — IL invariants", () => {
  it("zero deposits and zero current state produce zero IL", () => {
    const breakdown = computeIL({
      depositedToken0: "0",
      depositedToken1: "0",
      collectedFeesToken0: "0",
      collectedFeesToken1: "0",
      currentAmount0Raw: 0n,
      currentAmount1Raw: 0n,
      token0Decimals: 18,
      token1Decimals: 18,
      token0Price: "1",
    });
    expect(breakdown.hodlValueT1).toBe(0);
    expect(breakdown.lpValueT1).toBe(0);
    expect(breakdown.feesValueT1).toBe(0);
    expect(breakdown.ilT1).toBe(0);
    expect(breakdown.ilPct).toBe(0);
  });

  it("current price equal to deposit price with no fees yields zero IL", () => {
    // deposited 1 token0 + 1 token1 at price 1.0
    // current state mirrors the deposit (no swap activity)
    const breakdown = computeIL({
      depositedToken0: "1",
      depositedToken1: "1",
      collectedFeesToken0: "0",
      collectedFeesToken1: "0",
      currentAmount0Raw: 10n ** 18n,
      currentAmount1Raw: 10n ** 18n,
      token0Decimals: 18,
      token1Decimals: 18,
      token0Price: "1",
    });
    // hodl: 1*1 + 1 = 2
    // lp: 1*1 + 1 = 2
    // fees: 0
    // il = 2 - (2 + 0) = 0
    expect(breakdown.hodlValueT1).toBeCloseTo(2, 9);
    expect(breakdown.lpValueT1).toBeCloseTo(2, 9);
    expect(breakdown.ilT1).toBeCloseTo(0, 9);
    expect(breakdown.ilPct).toBeCloseTo(0, 9);
  });

  it("price drift with no LP rebalancing produces non-zero IL vs HODL", () => {
    // deposited 1 + 1 at price 1.0 → hodl = 2 in t1.
    // Now price moves to 2.0 (token0 doubled).
    // hodl new value = 1*2 + 1 = 3
    // LP would have rebalanced toward token0; here we model the LP
    // ending up with 0.7 token0 + 1.4 token1 (synthetic) → lp = 1.4 +
    // 1.4 = 2.8.
    // il = 3 - (2.8 + 0) = 0.2 (loss of 0.2 in t1 vs hodl).
    const breakdown = computeIL({
      depositedToken0: "1",
      depositedToken1: "1",
      collectedFeesToken0: "0",
      collectedFeesToken1: "0",
      currentAmount0Raw: 7n * 10n ** 17n, // 0.7
      currentAmount1Raw: 14n * 10n ** 17n, // 1.4
      token0Decimals: 18,
      token1Decimals: 18,
      token0Price: "2",
    });
    expect(breakdown.hodlValueT1).toBeCloseTo(3, 9);
    expect(breakdown.lpValueT1).toBeCloseTo(2.8, 9);
    expect(breakdown.ilT1).toBeCloseTo(0.2, 9);
    expect(breakdown.ilPct).toBeCloseTo(0.2 / 3, 9);
  });

  it("collected fees offset IL when added back to LP value", () => {
    const noFees = computeIL({
      depositedToken0: "1",
      depositedToken1: "1",
      collectedFeesToken0: "0",
      collectedFeesToken1: "0",
      currentAmount0Raw: 7n * 10n ** 17n,
      currentAmount1Raw: 14n * 10n ** 17n,
      token0Decimals: 18,
      token1Decimals: 18,
      token0Price: "2",
    });
    const withFees = computeIL({
      depositedToken0: "1",
      depositedToken1: "1",
      collectedFeesToken0: "0",
      collectedFeesToken1: "0.2",
      currentAmount0Raw: 7n * 10n ** 17n,
      currentAmount1Raw: 14n * 10n ** 17n,
      token0Decimals: 18,
      token1Decimals: 18,
      token0Price: "2",
    });
    // Fees of 0.2 t1 should reduce ilT1 by 0.2 — exactly cancelling
    // the synthetic IL above.
    expect(withFees.ilT1).toBeCloseTo(noFees.ilT1 - 0.2, 9);
  });
});

describe("phase 3 — current amount invariants", () => {
  it("current tick below tickLower means liquidity is all in token0", () => {
    const a = computeCurrentAmounts({
      liquidity: "1000000000000000000",
      tickLower: 100,
      tickUpper: 200,
      currentTick: 50,
      sqrtPriceX96: SQRT_PRICE_X96_AT_TICK_0,
    });
    expect(a.amount0 > 0n).toBe(true);
    expect(a.amount1).toBe(0n);
  });

  it("current tick above tickUpper means liquidity is all in token1", () => {
    const a = computeCurrentAmounts({
      liquidity: "1000000000000000000",
      tickLower: 100,
      tickUpper: 200,
      currentTick: 300,
      sqrtPriceX96: SQRT_PRICE_X96_AT_TICK_0,
    });
    expect(a.amount0).toBe(0n);
    expect(a.amount1 > 0n).toBe(true);
  });
});
