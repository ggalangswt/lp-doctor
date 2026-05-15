import { createRequire } from "node:module";
import JSBI from "jsbi";
import { GraphQLClient } from "graphql-request";
import { describe, expect, it } from "vitest";
import {
  createPublicClient,
  http,
  type Hex,
} from "viem";
import { mainnet } from "viem/chains";
import type {
  SwapMath as SwapMathT,
  TickMath as TickMathT,
} from "@uniswap/v3-sdk";

// AT-2 — real swap replay against live mainnet V3 data.
//
// For each of N recent swaps on USDC/WETH 0.05 %, fetches the pool's
// liquidity AT the swap's block from mainnet RPC, runs
// `SwapMath.computeSwapStep(sqrtPre, sqrtLimit, L, amountIn, feePips)`,
// and asserts the resulting sqrtPriceX96 matches the chain's recorded
// post-swap sqrtPriceX96 within 10 basis points.
//
// Skipped without `THE_GRAPH_KEY`. Uses `publicnode` mainnet RPC by
// default; override via `OG_AT2_RPC`.
//
// This is the empirical-calibration test that the README phase 6
// "heuristic" disclaimer has so far been waiting on. It validates the
// swap-step primitive matches on-chain V3 behavior on real data —
// per-block accurate liquidity reads close the AT-2 spec gap that
// previous "designed-not-wired" placeholder left open.

const KEY = process.env.THE_GRAPH_KEY;
const SUBGRAPH_ID = "5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV";
const POOL_USDC_WETH_500 =
  "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640" as Hex;
const RPC_URL =
  process.env.OG_AT2_RPC ?? "https://ethereum-rpc.publicnode.com";

const require = createRequire(import.meta.url);
const sdk = require("@uniswap/v3-sdk") as {
  SwapMath: typeof SwapMathT;
  TickMath: typeof TickMathT;
};
const { SwapMath, TickMath } = sdk;

interface SwapEvent {
  id: string;
  amount0: string;
  amount1: string;
  sqrtPriceX96: string;
  tick: string | null;
  logIndex: string;
  token0: { decimals: string };
  token1: { decimals: string };
  transaction: { id: string; blockNumber: string; timestamp: string };
}

const SWAPS_QUERY = /* GraphQL */ `
  query SwapsByPool($pool: String!, $first: Int!) {
    swaps(
      where: { pool: $pool }
      first: $first
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      amount0
      amount1
      sqrtPriceX96
      tick
      logIndex
      token0 {
        decimals
      }
      token1 {
        decimals
      }
      transaction {
        id
        blockNumber
        timestamp
      }
    }
  }
`;

// V3 subgraph stores amounts as decimal strings already scaled by token
// decimals (e.g. "2220.441232" for USDC where decimals=6). Convert back
// to raw wei by parsing the integer + fractional parts and multiplying
// by 10^decimals.
function decimalToWei(decimalStr: string, decimals: number): bigint {
  const negative = decimalStr.startsWith("-");
  const s = negative ? decimalStr.slice(1) : decimalStr;
  const [whole, frac = ""] = s.split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  const raw = BigInt(whole + fracPadded);
  return negative ? -raw : raw;
}

const POOL_ABI = [
  {
    name: "liquidity",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint128" }],
  },
  {
    name: "slot0",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "sqrtPriceX96", type: "uint160" },
      { name: "tick", type: "int24" },
      { name: "observationIndex", type: "uint16" },
      { name: "observationCardinality", type: "uint16" },
      { name: "observationCardinalityNext", type: "uint16" },
      { name: "feeProtocol", type: "uint8" },
      { name: "unlocked", type: "bool" },
    ],
  },
] as const;

function bpsDistance(a: JSBI, b: JSBI): number {
  if (JSBI.equal(b, JSBI.BigInt(0))) return 0;
  const diff = JSBI.subtract(a, b);
  const absDiff = JSBI.lessThan(diff, JSBI.BigInt(0))
    ? JSBI.unaryMinus(diff)
    : diff;
  const scaled = JSBI.multiply(absDiff, JSBI.BigInt(10_000));
  const ratio = JSBI.divide(scaled, b);
  return JSBI.toNumber(ratio);
}

describe.skipIf(!KEY)("AT-2 — real swap replay vs on-chain sqrtPriceX96", () => {
  const subgraph = new GraphQLClient(
    `https://gateway.thegraph.com/api/${KEY}/subgraphs/id/${SUBGRAPH_ID}`,
  );
  const rpc = createPublicClient({
    chain: mainnet,
    transport: http(RPC_URL),
  });
  const FEE_PIPS = 500; // 0.05 %

  it("matches post-swap sqrtPriceX96 within 10 bps for non-crossing swaps", async () => {
    // Pull 8 most-recent swaps on USDC/WETH 0.05.
    const data = await subgraph.request<{ swaps: SwapEvent[] }>(SWAPS_QUERY, {
      pool: POOL_USDC_WETH_500,
      first: 8,
    });
    const swaps = [...data.swaps].reverse(); // oldest-first
    expect(swaps.length).toBeGreaterThan(2);

    let asserted = 0;
    let skipped = 0;
    let maxBps = 0;

    for (const swap of swaps) {
      const block = BigInt(swap.transaction.blockNumber);
      // Read pool state ONE block before the swap (= pre-swap state).
      // V3's Swap event fires from the pool itself; the swap's effect on
      // sqrtPriceX96/liquidity is already applied at this block, so we
      // read at block-1 to get the pre-state.
      const preBlock = block - 1n;
      let preLiquidity: bigint;
      let preSqrt: bigint;
      let preTick: number;
      try {
        const [liq, slot0] = await Promise.all([
          rpc.readContract({
            address: POOL_USDC_WETH_500,
            abi: POOL_ABI,
            functionName: "liquidity",
            blockNumber: preBlock,
          }),
          rpc.readContract({
            address: POOL_USDC_WETH_500,
            abi: POOL_ABI,
            functionName: "slot0",
            blockNumber: preBlock,
          }),
        ]);
        preLiquidity = liq as bigint;
        const slot = slot0 as readonly [bigint, number, ...unknown[]];
        preSqrt = slot[0];
        preTick = slot[1];
      } catch {
        // Some RPC nodes prune ancient state; skip the swap if we can't
        // read pre-state.
        skipped++;
        continue;
      }

      // Direction. amount0 > 0 means user sent token0 in (zeroForOne).
      const decimals0 = parseInt(swap.token0.decimals, 10);
      const decimals1 = parseInt(swap.token1.decimals, 10);
      const amt0Wei = decimalToWei(swap.amount0, decimals0);
      const amt1Wei = decimalToWei(swap.amount1, decimals1);
      const zeroForOne = amt0Wei > 0n;
      const amountIn = zeroForOne
        ? JSBI.BigInt(amt0Wei.toString())
        : JSBI.BigInt(amt1Wei.toString());

      const sqrtTarget = zeroForOne
        ? TickMath.MIN_SQRT_RATIO
        : TickMath.MAX_SQRT_RATIO;

      // Skip swaps that crossed an initialized tick. Heuristic: if the
      // swap's recorded post-tick is outside [floor(preTick), ceil(preTick)]
      // by more than tickSpacing, it likely crossed. tickSpacing for fee
      // tier 500 is 10. Swaps crossing initialized ticks change the
      // active liquidity mid-swap, which one SwapMath step can't model.
      const postTick = swap.tick ? parseInt(swap.tick, 10) : preTick;
      if (Math.abs(postTick - preTick) > 10) {
        skipped++;
        continue;
      }

      const [sqrtPostReplay] = SwapMath.computeSwapStep(
        JSBI.BigInt(preSqrt.toString()),
        sqrtTarget,
        JSBI.BigInt(preLiquidity.toString()),
        amountIn,
        FEE_PIPS,
      );

      const sqrtPostActual = JSBI.BigInt(swap.sqrtPriceX96);
      const bps = bpsDistance(sqrtPostReplay, sqrtPostActual);
      maxBps = Math.max(maxBps, bps);
      // 10 bps tolerance per the spec.
      expect(bps).toBeLessThanOrEqual(10);
      asserted++;
    }

    expect(asserted).toBeGreaterThan(2);
    // eslint-disable-next-line no-console
    console.log(
      `AT-2 swap replay: asserted=${asserted} skipped=${skipped} maxBps=${maxBps}`,
    );
  }, 90_000);
});
