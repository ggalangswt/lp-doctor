import { createPublicClient, http, type Hex } from "viem";
import { mainnet } from "viem/chains";
import { config } from "../config.js";
import { logger } from "../logger.js";

// Real chain decode of V4 PositionInfo. The V4 subgraph's `Position`
// entity is thin — it does not expose the `salt` that disambiguates
// multiple positions in the same pool/range owned by the same EOA, and
// it does not include the canonical `tickLower` / `tickUpper` for a
// given tokenId. The authoritative read is `PositionManager.
// getPoolAndPositionInfo(tokenId)` returning (PoolKey, packed uint256
// PositionInfo). We decode the packed PositionInfo per the layout
// documented in `PositionInfoLibrary.sol`:
//
//   bit  [  0 -   7] : uint8   hasSubscriber flag      (8 bits)
//   bit  [  8 -  31] : int24   tickLower (signed)      (24 bits)
//   bit  [ 32 -  55] : int24   tickUpper (signed)      (24 bits)
//   bit  [ 56 - 255] : bytes25 truncatedPoolId         (200 bits)

const POS_MGR_ABI = [
  {
    name: "getPoolAndPositionInfo",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        name: "poolKey",
        type: "tuple",
        components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" },
        ],
      },
      { name: "info", type: "uint256" },
    ],
  },
  {
    name: "getPositionLiquidity",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "liquidity", type: "uint128" }],
  },
] as const;

const DEFAULT_POSITION_MANAGER =
  "0xbd216513d74c8cf14cf4747e6aaa6420ff64ee9e" as Hex;

export interface V4PositionInfo {
  tokenId: string;
  hasSubscriber: boolean;
  tickLower: number;
  tickUpper: number;
  liquidity: string;
  poolKey: {
    currency0: string;
    currency1: string;
    fee: number;
    tickSpacing: number;
    hooks: string;
  };
  source: "v4-position-manager";
}

export interface V4PositionFetchError {
  tokenId: string;
  error: string;
  source: "v4-position-manager";
}

export type V4PositionFetchResult = V4PositionInfo | V4PositionFetchError;

function decodePositionInfo(packed: bigint): {
  hasSubscriber: boolean;
  tickLower: number;
  tickUpper: number;
} {
  const hasSubscriber = (packed & 0xffn) !== 0n;
  const rawLower = Number((packed >> 8n) & 0xffffffn);
  const rawUpper = Number((packed >> 32n) & 0xffffffn);
  // sign-extend int24 to JS number
  const tickLower = rawLower > 0x7fffff ? rawLower - 0x1000000 : rawLower;
  const tickUpper = rawUpper > 0x7fffff ? rawUpper - 0x1000000 : rawUpper;
  return { hasSubscriber, tickLower, tickUpper };
}

export class V4PositionManagerClient {
  private contract: Hex;
  private rpcUrl: string;

  constructor() {
    this.contract = (process.env.V4_POSITION_MANAGER ??
      DEFAULT_POSITION_MANAGER) as Hex;
    this.rpcUrl = config.MAINNET_RPC;
  }

  isReady(): boolean {
    return Boolean(this.contract) && Boolean(this.rpcUrl);
  }

  async fetch(tokenId: string): Promise<V4PositionFetchResult> {
    try {
      const client = createPublicClient({
        chain: mainnet,
        transport: http(this.rpcUrl),
      });

      // Single call returns the [poolKey, info] tuple — no need to
      // read getPoolAndPositionInfo twice. Liquidity is a separate
      // view and runs in parallel.
      const [poolKeyAndInfo, liquidityResult] = await Promise.all([
        client.readContract({
          address: this.contract,
          abi: POS_MGR_ABI,
          functionName: "getPoolAndPositionInfo",
          args: [BigInt(tokenId)],
        }),
        client.readContract({
          address: this.contract,
          abi: POS_MGR_ABI,
          functionName: "getPositionLiquidity",
          args: [BigInt(tokenId)],
        }),
      ]);

      const [poolKey, info] = poolKeyAndInfo as readonly [
        {
          currency0: string;
          currency1: string;
          fee: number;
          tickSpacing: number;
          hooks: string;
        },
        bigint,
      ];

      const decoded = decodePositionInfo(info);

      return {
        tokenId,
        hasSubscriber: decoded.hasSubscriber,
        tickLower: decoded.tickLower,
        tickUpper: decoded.tickUpper,
        liquidity: (liquidityResult as bigint).toString(),
        poolKey: {
          currency0: poolKey.currency0,
          currency1: poolKey.currency1,
          fee: Number(poolKey.fee),
          tickSpacing: Number(poolKey.tickSpacing),
          hooks: poolKey.hooks,
        },
        source: "v4-position-manager",
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`v4 position manager read failed for ${tokenId}: ${msg}`);
      return { tokenId, error: msg, source: "v4-position-manager" };
    }
  }
}

export const v4PositionManager = new V4PositionManagerClient();
