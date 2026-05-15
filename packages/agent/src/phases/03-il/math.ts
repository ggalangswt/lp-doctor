// Phase 3 — Impermanent Loss reconstruction.
// Uses the Uniswap v3 whitepaper formulas (eq. 6.29 / 6.30) wrapped in
// @uniswap/v3-sdk. We never reimplement the math here.
//
// All values are returned in token1-denominated human units. Real USD
// pricing requires an oracle and lands in a follow-up phase.

import { createRequire } from "node:module";
import JSBI from "jsbi";
import type { SqrtPriceMath as SqrtPriceMathT, TickMath as TickMathT } from "@uniswap/v3-sdk";

// @uniswap/v3-sdk ships a broken ESM build (extensionless directory imports
// that strict Node ESM rejects with ERR_UNSUPPORTED_DIR_IMPORT). Bridge to
// the working CJS build via createRequire — a standard, well-known
// workaround that preserves the package's TypeScript types.
const require = createRequire(import.meta.url);
const sdk = require("@uniswap/v3-sdk") as {
  SqrtPriceMath: typeof SqrtPriceMathT;
  TickMath: typeof TickMathT;
};
const { SqrtPriceMath, TickMath } = sdk;

export interface CurrentAmounts {
  amount0: bigint; // raw wei
  amount1: bigint;
}

export function computeCurrentAmounts(args: {
  liquidity: string;
  tickLower: number;
  tickUpper: number;
  currentTick: number;
  sqrtPriceX96: string;
}): CurrentAmounts {
  const L = JSBI.BigInt(args.liquidity);
  const sqrtLower = TickMath.getSqrtRatioAtTick(args.tickLower);
  const sqrtUpper = TickMath.getSqrtRatioAtTick(args.tickUpper);
  const sqrtCurrent = JSBI.BigInt(args.sqrtPriceX96);

  let amount0 = JSBI.BigInt(0);
  let amount1 = JSBI.BigInt(0);

  if (args.currentTick < args.tickLower) {
    amount0 = SqrtPriceMath.getAmount0Delta(sqrtLower, sqrtUpper, L, false);
  } else if (args.currentTick >= args.tickUpper) {
    amount1 = SqrtPriceMath.getAmount1Delta(sqrtLower, sqrtUpper, L, false);
  } else {
    amount0 = SqrtPriceMath.getAmount0Delta(sqrtCurrent, sqrtUpper, L, false);
    amount1 = SqrtPriceMath.getAmount1Delta(sqrtLower, sqrtCurrent, L, false);
  }

  return { amount0: BigInt(amount0.toString()), amount1: BigInt(amount1.toString()) };
}

export function rawToHuman(raw: bigint, decimals: number): number {
  const div = 10 ** decimals;
  return Number(raw) / div;
}

export interface ILBreakdown {
  hodlValueT1: number;
  lpValueT1: number;
  ilT1: number;
  ilPct: number;
  feesValueT1: number;
}

// All inputs in human units (already-scaled subgraph BigDecimals) except for
// `currentAmount0Raw` / `currentAmount1Raw` which are wei from the math lib.
export function computeIL(args: {
  depositedToken0: string;
  depositedToken1: string;
  collectedFeesToken0: string;
  collectedFeesToken1: string;
  currentAmount0Raw: bigint;
  currentAmount1Raw: bigint;
  token0Decimals: number;
  token1Decimals: number;
  token0Price: string;
}): ILBreakdown {
  const dep0 = parseFloat(args.depositedToken0);
  const dep1 = parseFloat(args.depositedToken1);
  const fees0 = parseFloat(args.collectedFeesToken0);
  const fees1 = parseFloat(args.collectedFeesToken1);
  const price0InT1 = parseFloat(args.token0Price);

  const currentAmt0H = rawToHuman(args.currentAmount0Raw, args.token0Decimals);
  const currentAmt1H = rawToHuman(args.currentAmount1Raw, args.token1Decimals);

  const hodlValueT1 = dep0 * price0InT1 + dep1;
  const lpValueT1 = currentAmt0H * price0InT1 + currentAmt1H;
  const feesValueT1 = fees0 * price0InT1 + fees1;
  const ilT1 = hodlValueT1 - (lpValueT1 + feesValueT1);
  const ilPct = hodlValueT1 === 0 ? 0 : ilT1 / hodlValueT1;

  return { hodlValueT1, lpValueT1, ilT1, ilPct, feesValueT1 };
}
