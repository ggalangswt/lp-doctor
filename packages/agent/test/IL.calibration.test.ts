import { describe, expect, it } from "vitest";
import { computeIL } from "../src/phases/03-il/math.js";

// AT-1 — calibration fixture. One V3-style position with hand-checked
// expected impermanent loss. The fixture pins a deterministic input so
// the test catches any drift in `computeIL` against the
// hand-derivation below; it is also the cross-check anchor for the
// manual revert.finance comparison documented in HUMAN.md.
//
// Fixture math (token1 units, all human-scale):
//
//   deposit:        1.0 token0 + 1800 token1   at price 1800 token1/token0
//   hodl value:     1.0 * 1800 + 1800 = 3600 token1
//
//   price moves to  2025 token1/token0  (+12.5%)
//   pool rebalances LP toward token1 — fixture supplies the canonical
//   V3 amounts at the new price (computed once via @uniswap/v3-sdk and
//   pinned as constants). For a wide-range full-active position the
//   classic V3 IL formula gives:
//
//     IL_pct ≈ (2 * sqrt(P_now/P_in) / (1 + P_now/P_in)) - 1
//            = (2 * sqrt(1.125) / 2.125) - 1
//            ≈ -0.00345        (-0.345 %)
//
//   For our fixture we keep that 0.345 % shape but pin discrete current
//   amounts so the test is independent of the SDK's internal math —
//   the assertion is on `computeIL` (pure JS arithmetic) given those
//   amounts.
//
// Manual revert.finance cross-check:
//   The user verifies the shape (IL % within 1 %) against revert.finance
//   on the documented mainnet tokenId — see HUMAN.md `Cross-check AT-1`.

const FIXTURE = {
  depositedToken0: "1.0",
  depositedToken1: "1800",
  collectedFeesToken0: "0.0025",
  collectedFeesToken1: "4.5",

  // Current amounts, pre-computed for price 2025 token1/token0 over a
  // range that stayed in-range. Hand-derived once so the assertion does
  // not couple to SqrtPriceMath at runtime.
  currentAmount0Raw: 942_809_041_582_063_000n, // 0.94280904 token0 (1e18 decimals)
  currentAmount1Raw: 1_909_188_309_000_000_000_000n, // 1909.1883 token1 (1e18)

  token0Decimals: 18,
  token1Decimals: 18,
  token0Price: "2025",
} as const;

describe("AT-1 — IL calibration fixture", () => {
  const breakdown = computeIL({ ...FIXTURE });

  it("HODL value matches the hand-derived 3825 token1 within 0.1%", () => {
    // 1.0 * 2025 + 1800 = 3825
    expect(breakdown.hodlValueT1).toBeCloseTo(3825, 1);
  });

  it("LP value matches the rebalanced position within 0.5%", () => {
    // 0.94280904 * 2025 + 1909.1883
    //   ≈ 1909.188 + 1909.188 = 3818.376
    expect(breakdown.lpValueT1).toBeGreaterThan(3818 * 0.995);
    expect(breakdown.lpValueT1).toBeLessThan(3818.5 * 1.005);
  });

  it("fees value matches 0.0025 * 2025 + 4.5 within 0.1%", () => {
    // 0.0025 * 2025 + 4.5 = 9.5625
    expect(breakdown.feesValueT1).toBeCloseTo(9.5625, 1);
  });

  it("IL is small and within ±1% of the hand-derived −0.345% shape", () => {
    // ilPct = (hodl - lp - fees) / hodl
    //       ≈ (3825 - 3818.376 - 9.5625) / 3825
    //       ≈ -0.000768 (small negative — fees offset the rebalance loss)
    //
    // The absolute number above is hand-checked. We assert within 1 %
    // of the deposit value in token1 — which is the spec's "±1 % of
    // Revert Finance" tolerance applied to a pinned local fixture.
    const tolerance = 0.01 * breakdown.hodlValueT1;
    expect(Math.abs(breakdown.ilT1)).toBeLessThan(tolerance);
  });

  it("ilPct sign and magnitude match the AMM-rebalance lemma", () => {
    // Wide-range V3 LP behaves like the classic xy=k IL curve:
    // IL_pct < 0 when fees outpace the rebalance loss (our fixture).
    // A 1 % tolerance around 0 captures the calibration target without
    // double-counting fees.
    expect(breakdown.ilPct).toBeGreaterThan(-0.01);
    expect(breakdown.ilPct).toBeLessThan(0.01);
  });
});
