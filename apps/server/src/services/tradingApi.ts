import { config } from "../config.js";
import { logger } from "../logger.js";

const TRADING_API_URL = "https://trade-api.gateway.uniswap.org/v1";

// Live response shape verified 2026-04-24 against /v1/quote.
// Only the fields we surface to the agent are typed strictly; the rest
// passes through opaquely so we don't break on minor API additions.

interface QuotePoolHop {
  type: "v4-pool" | "v3-pool" | "v2-pool";
  address: string;
  tokenIn: { address: string; symbol: string; decimals: string };
  tokenOut: { address: string; symbol: string; decimals: string };
  fee: string;
  hooks?: string;
  amountIn: string;
  amountOut: string;
}

export interface QuoteResponse {
  requestId: string;
  routing: "CLASSIC" | string;
  permitData?: unknown;
  quote: {
    chainId: number;
    swapper: string;
    tradeType: "EXACT_INPUT" | "EXACT_OUTPUT";
    route: QuotePoolHop[][];
    input: { amount: string; token: string };
    output: { amount: string; token: string; recipient: string };
    slippage: number;
    priceImpact: number;
    gasFee: string;
    gasFeeUSD: string;
    gasUseEstimate: string;
  };
}

export interface QuoteRequest {
  tokenIn: string;
  tokenOut: string;
  amount: string; // exact input
  chainId: number;
  swapper: string;
  slippageTolerance?: number;
}

export class TradingApiClient {
  isReady(): boolean {
    return Boolean(config.UNISWAP_TRADING_API_KEY);
  }

  async quote(req: QuoteRequest): Promise<QuoteResponse> {
    if (!config.UNISWAP_TRADING_API_KEY) {
      throw new Error("UNISWAP_TRADING_API_KEY not configured");
    }
    const body = {
      tokenIn: req.tokenIn,
      tokenOut: req.tokenOut,
      amount: req.amount,
      type: "EXACT_INPUT" as const,
      tokenInChainId: req.chainId,
      tokenOutChainId: req.chainId,
      slippageTolerance: req.slippageTolerance ?? 0.5,
      swapper: req.swapper,
      routingPreference: "BEST_PRICE" as const,
    };

    const res = await fetch(`${TRADING_API_URL}/quote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.UNISWAP_TRADING_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      logger.error(
        `trading-api /quote failed status=${res.status} body=${text.slice(0, 200)}`,
      );
      throw new Error(`trading-api /quote ${res.status}`);
    }
    return (await res.json()) as QuoteResponse;
  }
}

export const tradingApi = new TradingApiClient();
