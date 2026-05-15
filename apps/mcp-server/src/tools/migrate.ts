// lpdoctor.migrate — returns the EIP-712 PermitSingle typed data for a
// given LP position. The calling agent can sign this with the user's
// wallet and the resulting signature authorizes the V3→swap→V4
// migration bundle without exposing custody. The MCP tool itself does
// not sign — signing stays in the user's wallet.

import { z } from "zod";

const DEFAULT_BASE_URL =
  process.env.LPDOCTOR_API_URL ??
  process.env.LPLENS_API_URL ??
  "https://lpdoctor.xyz";

const PERMIT2_ADDRESS =
  "0x000000000022D473030F116dDEE9F6B43aC78BA3" as const;

// Universal Router (mainnet) — canonical spender for the migration
// bundle. The agent never executes; the address is locked here for the
// EIP-712 domain so the calling agent can verify.
const UNIVERSAL_ROUTER_MAINNET =
  "0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af" as const;

const PERMIT_SINGLE_TYPES = {
  PermitSingle: [
    { name: "details", type: "PermitDetails" },
    { name: "spender", type: "address" },
    { name: "sigDeadline", type: "uint256" },
  ],
  PermitDetails: [
    { name: "token", type: "address" },
    { name: "amount", type: "uint160" },
    { name: "expiration", type: "uint48" },
    { name: "nonce", type: "uint48" },
  ],
} as const;

export const migrateInputSchema = z.object({
  tokenId: z.string().min(1),
  apiUrl: z.string().url().optional(),
  chainId: z.number().int().positive().optional(),
  spender: z.string().optional(),
  // Defaults: 30-day expiration, 30-min sigDeadline, nonce 0, max amount.
  expirationSeconds: z.number().int().positive().optional(),
  sigDeadlineSeconds: z.number().int().positive().optional(),
  nonce: z.number().int().nonnegative().optional(),
  amount: z.string().optional(),
});

export type MigrateInput = z.infer<typeof migrateInputSchema>;

export interface MigrateTypedData {
  tokenId: string;
  domain: {
    name: "Permit2";
    chainId: number;
    verifyingContract: typeof PERMIT2_ADDRESS;
  };
  primaryType: "PermitSingle";
  types: typeof PERMIT_SINGLE_TYPES;
  message: {
    details: {
      token: string;
      amount: string;
      expiration: number;
      nonce: number;
    };
    spender: string;
    sigDeadline: string;
  };
  position?: {
    pair: string;
    token0: string;
    token1: string;
  };
  warnings: string[];
}

interface Event {
  type: string;
  [k: string]: unknown;
}

export async function migrate(input: MigrateInput): Promise<MigrateTypedData> {
  const baseUrl = input.apiUrl ?? DEFAULT_BASE_URL;
  const chainId = input.chainId ?? 1;
  const spender = (input.spender ?? UNIVERSAL_ROUTER_MAINNET) as string;
  const nowSec = Math.floor(Date.now() / 1000);
  const expiration = nowSec + (input.expirationSeconds ?? 30 * 24 * 3600);
  const sigDeadline = nowSec + (input.sigDeadlineSeconds ?? 30 * 60);
  const nonce = input.nonce ?? 0;
  // uint160 max — the conventional "infinite" Permit2 amount.
  const defaultAmount = (1n << 160n) - 1n;
  const amount = input.amount ?? defaultAmount.toString();

  const warnings: string[] = [];
  let position: MigrateTypedData["position"];
  let tokenAddress: string | undefined;

  try {
    const res = await fetch(`${baseUrl}/api/positions/${input.tokenId}/meta`, {
      // best-effort lookup — server may not expose this route in early
      // demo. We fall back to running phase 1 over the SSE stream.
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const json = (await res.json()) as Record<string, unknown>;
      const pair = String(json["pair"] ?? "");
      tokenAddress = String(json["token0"] ?? "");
      position = {
        pair,
        token0: tokenAddress,
        token1: String(json["token1"] ?? ""),
      };
    }
  } catch {
    // fall through
  }

  if (!position) {
    // SSE fallback — run diagnose stream until phase 1 lands.
    try {
      const stream = await fetch(`${baseUrl}/api/diagnose/${input.tokenId}`, {
        headers: { Accept: "text/event-stream" },
      });
      if (stream.ok && stream.body) {
        const reader = stream.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let resolved = false;
        while (!resolved) {
          const r = await reader.read();
          if (r.done) break;
          buffer += decoder.decode(r.value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";
          for (const frame of frames) {
            const dataLine = frame
              .split("\n")
              .find((l) => l.startsWith("data:"));
            if (!dataLine) continue;
            try {
              const ev = JSON.parse(dataLine.slice(5).trim()) as Event;
              if (
                ev.type === "tool.result" &&
                ev["tool"] === "getV3Position"
              ) {
                const out = ev["output"] as Record<string, unknown>;
                const pair = String(out["pair"] ?? "");
                position = {
                  pair,
                  token0: String(out["token0"] ?? ""),
                  token1: String(out["token1"] ?? ""),
                };
                tokenAddress = position.token0 || undefined;
                resolved = true;
                break;
              }
            } catch {
              // skip
            }
          }
        }
        try {
          await reader.cancel();
        } catch {
          // ignore
        }
      }
    } catch (err) {
      warnings.push(
        `position lookup failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  if (!tokenAddress) {
    // Final fallback — emit typed data with a zero token so the calling
    // agent can still inspect the structure. Mark it clearly.
    tokenAddress = "0x0000000000000000000000000000000000000000";
    warnings.push(
      "could not resolve position token addresses; typed data uses zero address — sign at your own risk",
    );
  }

  return {
    tokenId: input.tokenId,
    domain: {
      name: "Permit2",
      chainId,
      verifyingContract: PERMIT2_ADDRESS,
    },
    primaryType: "PermitSingle",
    types: PERMIT_SINGLE_TYPES,
    message: {
      details: {
        token: tokenAddress,
        amount,
        expiration,
        nonce,
      },
      spender,
      sigDeadline: String(sigDeadline),
    },
    position,
    warnings,
  };
}

export const migrateToolDefinition = {
  name: "lpdoctor.migrate",
  description:
    "Build the EIP-712 PermitSingle typed data for a Uniswap V3 → V4 migration of the given LP position. Returns the structured payload (domain, types, message) ready for the user's wallet to sign. Does not execute — the calling agent or UI is responsible for surfacing the signature flow to the user.",
  inputSchema: {
    type: "object",
    properties: {
      tokenId: {
        type: "string",
        description: "Uniswap V3 NFT tokenId of the LP position.",
      },
      apiUrl: {
        type: "string",
        description: "LPDoctor API URL. Defaults to LPDOCTOR_API_URL or https://lpdoctor.xyz.",
      },
      chainId: {
        type: "number",
        description: "Chain id for the EIP-712 domain (defaults to 1).",
      },
      spender: {
        type: "string",
        description:
          "Permit2 spender address; defaults to the canonical Universal Router (mainnet).",
      },
      expirationSeconds: {
        type: "number",
        description:
          "Permit expiration window in seconds from now (default 30 days).",
      },
      sigDeadlineSeconds: {
        type: "number",
        description: "Signature deadline in seconds from now (default 30 min).",
      },
      nonce: {
        type: "number",
        description: "Permit nonce (default 0).",
      },
      amount: {
        type: "string",
        description:
          "Permit amount in wei (default uint160 max — the conventional infinite Permit2 amount).",
      },
    },
    required: ["tokenId"],
    additionalProperties: false,
  },
} as const;
