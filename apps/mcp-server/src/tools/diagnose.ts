// lpdoctor.diagnose — runs the full diagnostic pipeline on a
// Uniswap LP position. Wraps the server's SSE stream and accumulates
// every event into a structured summary the calling agent can reason
// over: position, IL breakdown, regime, candidate hooks, migration
// preview, report rootHash, anchor txHash, ENS subname, and verdict
// markdown.
//
// When `caller` is supplied, the tool checks LPDoctorAgent.isLicensed
// before streaming. Unlicensed callers get a `paymentRequired`
// summary listing how to mint a license (ABI fragment + contract
// address). Owners are always licensed; anonymous calls (no caller)
// fall back to open mode for local dev.

import type { Address } from "viem";
import { z } from "zod";
import { onchain } from "../services/onchain.js";

const DEFAULT_BASE_URL =
  process.env.LPDOCTOR_API_URL ?? "https://lpdoctor.xyz";

export const diagnoseInputSchema = z.object({
  tokenId: z.string().min(1),
  apiUrl: z.string().url().optional(),
  timeoutMs: z.number().int().positive().max(120_000).optional(),
  caller: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  agentTokenId: z.string().regex(/^[0-9]+$/).optional(),
});

export type DiagnoseInput = z.infer<typeof diagnoseInputSchema>;

export interface PaymentRequiredInfo {
  reason: "license_missing" | "license_expired";
  agentTokenId: string;
  licenseContract: string;
  chainId: number;
  mintLicenseAbi: string;
  suggestedPriceWei: string;
  suggestedExpirySeconds: number;
  hint: string;
}

export interface DiagnoseSummary {
  tokenId: string;
  paymentRequired?: PaymentRequiredInfo;
  position?: { pair: string; tickLower: number; tickUpper: number; liquidity: string };
  il?: {
    hodlValueT1: number;
    lpValueT1: number;
    feesValueT1: number;
    ilT1: number;
    ilPct: number;
  };
  regime?: { topLabel: string; confidence: number };
  hooks?: { topFamily: string; count: number };
  migration?: {
    targetHookAddress?: string;
    priceImpactPct?: number;
    warnings: string[];
  };
  provenance?: { rootHash: string; storageUrl: string; stub: boolean };
  anchor?: { txHash: string; chainId: number; stub: boolean };
  verdict?: { markdown: string; model: string; stub: boolean };
  ens?: { fullName: string; resolverUrl: string; recordCount: number; stub: boolean };
  errors: string[];
  durationMs: number;
}

const DEFAULT_AGENT_TOKEN_ID =
  process.env.LPDOCTOR_AGENT_TOKEN_ID ?? "1";
const SUGGESTED_PRICE_WEI =
  process.env.LPDOCTOR_LICENSE_PRICE_WEI ?? "100000000000000000"; // 0.1 OG
const SUGGESTED_EXPIRY_SECONDS = 24 * 60 * 60; // 24 h

const MINT_LICENSE_ABI =
  "function mintLicense(uint256 tokenId, address licensee, uint64 expiresAt) external payable";

interface Event {
  type: string;
  [k: string]: unknown;
}

export async function diagnose(input: DiagnoseInput): Promise<DiagnoseSummary> {
  const baseUrl = input.apiUrl ?? DEFAULT_BASE_URL;
  const timeoutMs = input.timeoutMs ?? 90_000;
  const t0 = Date.now();

  const summary: DiagnoseSummary = {
    tokenId: input.tokenId,
    errors: [],
    durationMs: 0,
  };

  // License gate — only enforced when both `caller` and the iNFT contract
  // are configured. Owners pass through (isLicensed handles owner === caller
  // server-side). Without caller we keep the dev-friendly open mode.
  if (input.caller) {
    const required = await checkLicense({
      caller: input.caller as Address,
      agentTokenId: input.agentTokenId ?? DEFAULT_AGENT_TOKEN_ID,
    });
    if (required) {
      summary.paymentRequired = required;
      summary.durationMs = Date.now() - t0;
      return summary;
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseUrl}/api/diagnose/${input.tokenId}`, {
      headers: { Accept: "text/event-stream" },
      signal: controller.signal,
    });
    if (!res.ok || !res.body) {
      throw new Error(`HTTP ${res.status} from ${baseUrl}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by blank lines.
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";

      for (const frame of frames) {
        const dataLine = frame.split("\n").find((l) => l.startsWith("data:"));
        if (!dataLine) continue;
        const json = dataLine.slice(5).trim();
        if (!json) continue;
        try {
          const ev = JSON.parse(json) as Event;
          applyEvent(summary, ev);
        } catch {
          // skip malformed frame
        }
      }
    }
  } catch (err) {
    summary.errors.push(err instanceof Error ? err.message : String(err));
  } finally {
    clearTimeout(timeout);
  }

  summary.durationMs = Date.now() - t0;
  return summary;
}

function applyEvent(s: DiagnoseSummary, ev: Event): void {
  if (ev.type === "tool.result") {
    const tool = ev["tool"] as string;
    const out = ev["output"] as Record<string, unknown>;
    if (tool === "getV3Position" && out) {
      s.position = {
        pair: String(out["pair"] ?? ""),
        tickLower: Number(out["tickLower"] ?? 0),
        tickUpper: Number(out["tickUpper"] ?? 0),
        liquidity: String(out["liquidity"] ?? ""),
      };
    } else if (tool === "computeIL" && out) {
      s.il = {
        hodlValueT1: Number(out["hodlValueT1"] ?? 0),
        lpValueT1: Number(out["lpValueT1"] ?? 0),
        feesValueT1: Number(out["feesValueT1"] ?? 0),
        ilT1: Number(out["ilT1"] ?? 0),
        ilPct: Number(out["ilPct"] ?? 0),
      };
    } else if (tool === "classifyRegime" && out) {
      s.regime = {
        topLabel: String(out["topLabel"] ?? ""),
        confidence: Number(out["confidence"] ?? 0),
      };
    } else if (tool === "discoverV4Hooks" && out) {
      s.hooks = {
        topFamily: String(out["topFamily"] ?? "UNKNOWN"),
        count: Number(out["count"] ?? 0),
      };
    } else if (tool === "buildMigrationPreview" && out) {
      const targetHook = out["targetHook"] as Record<string, unknown> | undefined;
      const swapQuote = out["swapQuote"] as Record<string, unknown> | undefined;
      s.migration = {
        targetHookAddress: targetHook ? String(targetHook["address"]) : undefined,
        priceImpactPct: swapQuote
          ? Number(swapQuote["priceImpact"] ?? 0) * 100
          : undefined,
        warnings: (out["warnings"] as string[]) ?? [],
      };
    } else if (tool === "publishEnsRecords" && out) {
      const records = (out["records"] as unknown[]) ?? [];
      s.ens = {
        fullName: String(out["fullName"] ?? ""),
        resolverUrl: String(out["resolverUrl"] ?? ""),
        recordCount: records.length,
        stub: Boolean(out["stub"]),
      };
    }
  } else if (ev.type === "report.uploaded") {
    const rootHash = String(ev["rootHash"] ?? "");
    const storageUrl = String(ev["storageUrl"] ?? "");
    s.provenance = {
      rootHash,
      storageUrl,
      stub: rootHash.startsWith("0xstub") || storageUrl.startsWith("stub://"),
    };
  } else if (ev.type === "report.anchored") {
    const txHash = String(ev["txHash"] ?? "");
    s.anchor = {
      txHash,
      chainId: Number(ev["chainId"] ?? 0),
      stub: txHash.startsWith("0xstub"),
    };
  } else if (ev.type === "verdict.final") {
    const labels = (ev["labels"] as Record<string, string>) ?? {};
    s.verdict = {
      markdown: String(ev["markdown"] ?? ""),
      model: String(labels["model"] ?? ""),
      stub: labels["label"] === "EMULATED",
    };
  } else if (ev.type === "error") {
    s.errors.push(String(ev["message"] ?? "unknown error"));
  }
}

async function checkLicense(args: {
  caller: Address;
  agentTokenId: string;
}): Promise<PaymentRequiredInfo | null> {
  const client = onchain();
  if (!client.isConfigured()) return null;
  const tokenIdBig = BigInt(args.agentTokenId);
  const licensed = await client.isLicensed(tokenIdBig, args.caller);
  if (licensed) return null;
  return {
    reason: "license_missing",
    agentTokenId: args.agentTokenId,
    licenseContract: client.contractAddress() as string,
    chainId: client.chainId(),
    mintLicenseAbi: MINT_LICENSE_ABI,
    suggestedPriceWei: SUGGESTED_PRICE_WEI,
    suggestedExpirySeconds: SUGGESTED_EXPIRY_SECONDS,
    hint:
      "Call mintLicense(tokenId, caller, expiresAt) on licenseContract with msg.value >= suggestedPriceWei. Royalty splits automatically.",
  };
}

export const diagnoseToolDefinition = {
  name: "lpdoctor.diagnose",
  description:
    "Run the full LPDoctor diagnostic on a Uniswap V3 LP position. Streams SSE from the server, returns a structured summary of position, IL, regime, hooks, migration plan, signed report, on-chain anchor, ENS publish, and TEE verdict. When `caller` is set, requires a non-expired license on the LPDoctorAgent iNFT — otherwise returns paymentRequired info.",
  inputSchema: {
    type: "object",
    properties: {
      tokenId: {
        type: "string",
        description: "Uniswap V3 NFT tokenId of the LP position.",
      },
      apiUrl: {
        type: "string",
        description:
          "LPDoctor API URL. Defaults to LPDOCTOR_API_URL env or https://lpdoctor.xyz (production deployment).",
      },
      timeoutMs: {
        type: "number",
        description: "Stream timeout in milliseconds (max 120 000).",
      },
      caller: {
        type: "string",
        description:
          "Optional 0x-prefixed address of the agent calling this tool. When set, the MCP layer checks LPDoctorAgent.isLicensed before streaming and returns paymentRequired info if the caller has no valid license.",
      },
      agentTokenId: {
        type: "string",
        description:
          "LPDoctorAgent iNFT tokenId to gate against. Defaults to LPDOCTOR_AGENT_TOKEN_ID env or 1.",
      },
    },
    required: ["tokenId"],
    additionalProperties: false,
  },
} as const;
