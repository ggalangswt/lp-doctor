// lpdoctor.resolveEnsRecord — reads a single ENS text record. Useful for
// agents that want to verify the LPDoctor parent name's published per-
// position records without going through the LPDoctor API. Pure on-chain
// read via a public RPC; no signing key required.

import { z } from "zod";
import {
  createPublicClient,
  http,
  namehash,
  type Hex,
} from "viem";
import { mainnet, sepolia } from "viem/chains";

const RESOLVER_ABI = [
  {
    name: "text",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "key", type: "string" },
    ],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

const DEFAULT_RESOLVER_SEPOLIA = "0x8FADE66B79cC9f707aB26799354482EB93a5B7dD";
const DEFAULT_RESOLVER_MAINNET = "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63";

export const resolveEnsRecordInputSchema = z.object({
  name: z.string().min(3),
  key: z.string().min(1),
  network: z.enum(["mainnet", "sepolia"]).optional(),
  resolver: z.string().optional(),
  rpcUrl: z.string().url().optional(),
});

export type ResolveEnsRecordInput = z.infer<typeof resolveEnsRecordInputSchema>;

export interface ResolveEnsRecordResult {
  name: string;
  key: string;
  value: string;
  network: "mainnet" | "sepolia";
  resolver: string;
  found: boolean;
  error?: string;
}

export async function resolveEnsRecord(
  input: ResolveEnsRecordInput,
): Promise<ResolveEnsRecordResult> {
  const network = input.network ?? "sepolia";
  const resolver =
    (input.resolver ??
      (network === "mainnet" ? DEFAULT_RESOLVER_MAINNET : DEFAULT_RESOLVER_SEPOLIA)) as Hex;
  const chain = network === "mainnet" ? mainnet : sepolia;
  const transport = http(input.rpcUrl);

  try {
    const client = createPublicClient({ chain, transport });
    const node = namehash(input.name);
    const value = await client.readContract({
      address: resolver,
      abi: RESOLVER_ABI,
      functionName: "text",
      args: [node, input.key],
    });
    return {
      name: input.name,
      key: input.key,
      value: value as string,
      network,
      resolver,
      found: typeof value === "string" && value.length > 0,
    };
  } catch (err) {
    return {
      name: input.name,
      key: input.key,
      value: "",
      network,
      resolver,
      found: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export const resolveEnsRecordToolDefinition = {
  name: "lpdoctor.resolveEnsRecord",
  description:
    "Read a single ENS text record (e.g. lpdoctor.483104.rootHash on lpdoctor-demo.eth). Pure on-chain view; no signing required. Use this to verify what LPDoctor has published for any tokenId without going through the LPDoctor API.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "ENS name (e.g. lpdoctor-demo.eth).",
      },
      key: {
        type: "string",
        description:
          "Text record key (e.g. lpdoctor.483104.rootHash, lpdoctor.483104.anchorTx).",
      },
      network: {
        type: "string",
        enum: ["mainnet", "sepolia"],
        description: "ENS network. Defaults to sepolia.",
      },
      resolver: {
        type: "string",
        description: "Resolver contract address. Defaults to the public resolver of the chosen network.",
      },
      rpcUrl: {
        type: "string",
        description: "RPC URL. Defaults to viem's public RPC for the chain.",
      },
    },
    required: ["name", "key"],
    additionalProperties: false,
  },
} as const;
