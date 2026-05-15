import { createRequire } from "node:module";
import JSBI from "jsbi";
import { describe, expect, it } from "vitest";
import type {
  SwapMath as SwapMathT,
  TickMath as TickMathT,
} from "@uniswap/v3-sdk";

// AT-2 building-block — verifies the swap-step math primitive that a
// full swap-replay engine would iterate over per swap. The full AT-2
// test (replay 1 000 mainnet swaps without a hook → assert final
// sqrtPriceX96 within 10 bps of actual on-chain) is documented in
// data/reliability-tests.md as designed-not-wired; this test pins the
// per-step primitive so the future engine has a hermetic regression
// guard.
//
// Same CJS bridge pattern as packages/agent/src/phases/03-il/math.ts —
// @uniswap/v3-sdk ships a broken ESM build.

const require = createRequire(import.meta.url);
const sdk = require("@uniswap/v3-sdk") as {
  SwapMath: typeof SwapMathT;
  TickMath: typeof TickMathT;
};
const { SwapMath, TickMath } = sdk;

describe("AT-2 building block — SwapMath.computeSwapStep", () => {
  it("returns a 4-tuple [sqrtRatioNext, amountIn, amountOut, feeAmount]", () => {
    // Tick 0 (price = 1) → tick 60 (price ≈ 1.006).
    const sqrtCurrent = TickMath.getSqrtRatioAtTick(0);
    const sqrtTarget = TickMath.getSqrtRatioAtTick(60);
    const liquidity = JSBI.BigInt("1000000000000000000"); // 1e18
    // Exact-input swap of 1000 token0.
    const amountRemaining = JSBI.BigInt("1000");
    const feePips = 3000; // 0.3 %

    const result = SwapMath.computeSwapStep(
      sqrtCurrent,
      sqrtTarget,
      liquidity,
      amountRemaining,
      feePips,
    );

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(4);
    const [sqrtRatioNext, amountIn, amountOut, feeAmount] = result;
    // All four are JSBI bigints.
    for (const v of [sqrtRatioNext, amountIn, amountOut, feeAmount]) {
      expect(typeof v.toString()).toBe("string");
    }
  });

  it("price moves toward the target on a partial-fill swap step", () => {
    const sqrtCurrent = TickMath.getSqrtRatioAtTick(0);
    const sqrtTarget = TickMath.getSqrtRatioAtTick(120);
    const liquidity = JSBI.BigInt("1000000000000000000");
    // Small input — won't reach the target.
    const amountRemaining = JSBI.BigInt("100");
    const feePips = 3000;

    const [sqrtRatioNext] = SwapMath.computeSwapStep(
      sqrtCurrent,
      sqrtTarget,
      liquidity,
      amountRemaining,
      feePips,
    );

    // Current < next < target (price moves up toward target).
    expect(JSBI.greaterThan(sqrtRatioNext, sqrtCurrent)).toBe(true);
    expect(JSBI.lessThanOrEqual(sqrtRatioNext, sqrtTarget)).toBe(true);
  });

  it("zero-amount swap returns the current price unchanged", () => {
    const sqrtCurrent = TickMath.getSqrtRatioAtTick(60);
    const sqrtTarget = TickMath.getSqrtRatioAtTick(120);
    const liquidity = JSBI.BigInt("1000000000000000000");

    const [sqrtRatioNext, amountIn, amountOut] = SwapMath.computeSwapStep(
      sqrtCurrent,
      sqrtTarget,
      liquidity,
      JSBI.BigInt(0),
      3000,
    );

    expect(sqrtRatioNext.toString()).toBe(sqrtCurrent.toString());
    expect(amountIn.toString()).toBe("0");
    expect(amountOut.toString()).toBe("0");
  });

  it("fee is roughly proportional to amount swapped", () => {
    const sqrtCurrent = TickMath.getSqrtRatioAtTick(0);
    const sqrtTarget = TickMath.getSqrtRatioAtTick(60);
    const liquidity = JSBI.BigInt("1000000000000000000000");
    const feePips = 3000; // 0.30%

    const [, amountIn, , feeAmount] = SwapMath.computeSwapStep(
      sqrtCurrent,
      sqrtTarget,
      liquidity,
      JSBI.BigInt("1000000"),
      feePips,
    );

    // fee / (amountIn + fee) should approximate feePips / 1e6.
    const numer = parseFloat(feeAmount.toString());
    const denom = parseFloat(amountIn.toString()) + numer;
    if (denom > 0) {
      const observedFeeFraction = numer / denom;
      const expectedFeeFraction = feePips / 1_000_000;
      expect(
        Math.abs(observedFeeFraction - expectedFeeFraction),
      ).toBeLessThan(0.0005);
    }
  });
});
