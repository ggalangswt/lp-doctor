import type { Phase1Output } from "../01-resolution/types.js";
import type { HookCandidate } from "../05-hooks/types.js";
import type { MigrationPreview, MigrationStep } from "./types.js";

export interface QuoteHop {
  type: "v4-pool" | "v3-pool" | "v2-pool";
  address: string;
  tokenIn: { address: string; symbol: string; decimals: string };
  tokenOut: { address: string; symbol: string; decimals: string };
  fee: string;
  hooks?: string;
  amountIn: string;
  amountOut: string;
}

export interface QuoteSummary {
  routing: string;
  route: QuoteHop[][];
  input: { amount: string; token: string };
  output: { amount: string; token: string };
  slippage: number;
  priceImpact: number;
  gasFeeUSD: string;
}

export type Quoter = (args: {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  chainId: number;
  swapper: string;
}) => Promise<QuoteSummary | null>;

const DEMO_SWAPPER = "0x0000000000000000000000000000000000000001";
// We quote a small, deterministic notional so the preview is fast and
// doesn't depend on the user's actual position size. Real migration would
// scale the amount to the user's position when the user signs.
const SAMPLE_AMOUNT_TOKEN0_HUMAN = 1; // one unit of token0

function pickTopHook(candidates: HookCandidate[]): HookCandidate | null {
  if (candidates.length === 0) return null;
  let top = candidates[0];
  for (const c of candidates) {
    if (c.tvlUsd > top.tvlUsd) top = c;
  }
  return top;
}

export async function buildMigrationPreview(args: {
  position: Phase1Output;
  hookCandidates: HookCandidate[];
  quoter: Quoter;
  chainId?: number;
}): Promise<MigrationPreview> {
  const { position, hookCandidates, quoter } = args;
  const chainId = args.chainId ?? 1;
  const pool = position.pool.value;
  const top = pickTopHook(hookCandidates);

  const steps: MigrationStep[] = [
    {
      kind: "close",
      description: `Close V3 position #${position.tokenId} on ${pool.token0.symbol}/${pool.token1.symbol}`,
      detail: {
        liquidity: position.liquidity.value,
        tickLower: String(position.tickLower.value),
        tickUpper: String(position.tickUpper.value),
      },
    },
  ];
  const warnings: string[] = [
    "Migration is previewed only — the agent does not execute the swap. Quote uses a sample notional (1 unit of token0) to keep preview latency low.",
  ];

  if (!top) {
    warnings.push(
      "Searched the V4 PoolManager indexer for hooks on this pair — none deployed yet on this chain. The preview shows only the V3 burn step; the swap + V4 mint legs would COMPUTE as soon as a target hook appears.",
    );
    steps.push({
      kind: "mint",
      description: "Mint a fresh V3 position (no V4 alternative discovered)",
    });
    return { fromVersion: 3, steps, warnings };
  }

  const sampleAmount = (
    BigInt(Math.round(SAMPLE_AMOUNT_TOKEN0_HUMAN)) *
    BigInt(10 ** pool.token0.decimals)
  ).toString();

  let quote: QuoteSummary | null = null;
  try {
    quote = await quoter({
      tokenIn: pool.token0.address,
      tokenOut: pool.token1.address,
      amount: sampleAmount,
      chainId,
      swapper: DEMO_SWAPPER,
    });
  } catch (err) {
    warnings.push(
      `Trading API unavailable: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (quote) {
    steps.push({
      kind: "swap",
      description: `Swap a portion of token0 → token1 to match the target range`,
      detail: {
        routing: quote.routing,
        priceImpactPct: (quote.priceImpact * 100).toFixed(3),
        gasFeeUsd: quote.gasFeeUSD,
      },
    });
  } else {
    steps.push({
      kind: "swap",
      description: "Swap step — quote unavailable",
    });
  }

  steps.push({
    kind: "mint",
    description: `Mint V4 position via hook ${shortAddr(top.hookAddress)} (${top.family.toLowerCase().replace(/_/g, "-")})`,
    detail: {
      poolId: top.poolId,
      feeTier: String(top.feeTier),
      tickSpacing: String(top.tickSpacing),
    },
  });

  return {
    fromVersion: 3,
    targetHook: {
      address: top.hookAddress,
      family: top.family,
      poolId: top.poolId,
    },
    steps,
    swapQuote: quote
      ? {
          routing: quote.routing,
          amountIn: quote.input.amount,
          amountOut: quote.output.amount,
          priceImpact: quote.priceImpact,
          slippageTolerance: quote.slippage,
          gasFeeUsd: quote.gasFeeUSD,
          routeKinds: quote.route.flatMap((leg) => leg.map((h) => h.type)),
        }
      : undefined,
    warnings,
  };
}

function shortAddr(addr: string): string {
  return addr.length > 10
    ? `${addr.slice(0, 6)}…${addr.slice(-4)}`
    : addr;
}
