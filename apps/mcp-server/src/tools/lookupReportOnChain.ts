// lpdoctor.lookupReportOnChain — reads the LPDoctorReports registry on
// 0G Chain for a given rootHash. Returns the publisher, timestamp, and
// linked tokenId straight from the contract — independent of the LPDoctor
// server. Lets calling agents verify a report's on-chain commitment
// without trusting the LPDoctor API or the local cache.

import { z } from "zod";
import {
  createPublicClient,
  defineChain,
  http,
  type Hex,
} from "viem";

const REPORTS_ABI = [
  {
    name: "reports",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "rootHash", type: "bytes32" }],
    outputs: [
      { name: "publisher", type: "address" },
      { name: "timestamp", type: "uint64" },
      { name: "tokenId", type: "uint256" },
      { name: "rootHash", type: "bytes32" },
      { name: "attestation", type: "bytes" },
    ],
  },
] as const;

export const lookupReportOnChainInputSchema = z.object({
  rootHash: z.string().regex(/^0x[a-fA-F0-9]{40,64}$/),
  contract: z.string().optional(),
  rpcUrl: z.string().url().optional(),
  chainId: z.number().int().positive().optional(),
});

export type LookupReportOnChainInput = z.infer<
  typeof lookupReportOnChainInputSchema
>;

export interface LookupReportOnChainResult {
  rootHash: string;
  contract: string;
  chainId: number;
  found: boolean;
  publisher?: string;
  timestamp?: number;
  tokenId?: string;
  attestationLength?: number;
  error?: string;
}

const DEFAULT_CHAIN_ID = 16602;
const DEFAULT_RPC = "https://evmrpc-testnet.0g.ai";
const DEFAULT_REPORTS =
  process.env.LPDOCTOR_REPORTS_CONTRACT ??
  process.env.LPLENS_REPORTS_CONTRACT ??
  "";

export async function lookupReportOnChain(
  input: LookupReportOnChainInput,
): Promise<LookupReportOnChainResult> {
  const contract = (input.contract ?? DEFAULT_REPORTS) as Hex;
  const rpcUrl = input.rpcUrl ?? DEFAULT_RPC;
  const chainId = input.chainId ?? DEFAULT_CHAIN_ID;

  if (!contract) {
    return {
      rootHash: input.rootHash,
      contract: "",
      chainId,
      found: false,
      error:
        "LPDOCTOR_REPORTS_CONTRACT not set — pass `contract` arg or set env var.",
    };
  }

  try {
    const chain = defineChain({
      id: chainId,
      name: "0G Newton Testnet",
      nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] } },
    });
    const client = createPublicClient({ chain, transport: http() });

    const padded = padHash(input.rootHash);
    const result = (await client.readContract({
      address: contract,
      abi: REPORTS_ABI,
      functionName: "reports",
      args: [padded],
    })) as readonly [string, bigint, bigint, string, string];

    const [publisher, timestamp, tokenId, , attestation] = result;
    const found = publisher !== "0x0000000000000000000000000000000000000000";

    return {
      rootHash: padded,
      contract,
      chainId,
      found,
      publisher: found ? publisher : undefined,
      timestamp: found ? Number(timestamp) : undefined,
      tokenId: found ? tokenId.toString() : undefined,
      attestationLength: found
        ? Math.max(0, (attestation.length - 2) / 2)
        : undefined,
    };
  } catch (err) {
    return {
      rootHash: input.rootHash,
      contract,
      chainId,
      found: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function padHash(value: string): Hex {
  const hex = value.startsWith("0x") ? value.slice(2) : value;
  return ("0x" + hex.padStart(64, "0")) as Hex;
}

export const lookupReportOnChainToolDefinition = {
  name: "lpdoctor.lookupReportOnChain",
  description:
    "Read the LPDoctorReports registry on 0G Chain by rootHash. Returns the publisher, on-chain timestamp, and linked tokenId straight from the contract — no LPDoctor API trust required. Use this to independently verify what an LPDoctor diagnose committed on-chain.",
  inputSchema: {
    type: "object",
    properties: {
      rootHash: {
        type: "string",
        description: "Merkle rootHash to look up (0x-prefixed hex, up to 32 bytes).",
      },
      contract: {
        type: "string",
        description:
          "LPDoctorReports contract address. Defaults to LPDOCTOR_REPORTS_CONTRACT env.",
      },
      rpcUrl: {
        type: "string",
        description: "0G RPC URL. Defaults to https://evmrpc-testnet.0g.ai.",
      },
      chainId: {
        type: "number",
        description: "0G chain id. Defaults to 16602 (Newton testnet).",
      },
    },
    required: ["rootHash"],
    additionalProperties: false,
  },
} as const;
