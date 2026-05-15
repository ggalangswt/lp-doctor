// lpdoctor.preflight — runs the migration preview pipeline (Uniswap
// Trading API quote + close→swap→mint plan) for a given LP position
// and returns the structured preview without TEE / 0G storage / ENS
// publish. Use this from a calling agent that wants to surface a
// migration option to a user before committing to a full diagnostic.

import { z } from "zod";

const DEFAULT_BASE_URL =
  process.env.LPDOCTOR_API_URL ??
  process.env.LPLENS_API_URL ??
  "https://lpdoctor.xyz";

export const preflightInputSchema = z.object({
  tokenId: z.string().min(1),
  apiUrl: z.string().url().optional(),
  timeoutMs: z.number().int().positive().max(60_000).optional(),
});

export type PreflightInput = z.infer<typeof preflightInputSchema>;

export interface PreflightSummary {
  tokenId: string;
  position?: {
    pair: string;
    tickLower: number;
    tickUpper: number;
    liquidity: string;
  };
  migration?: {
    targetHookAddress?: string;
    targetHookFamily?: string;
    priceImpactPct?: number;
    slippageBps?: number;
    routingType?: string;
    warnings: string[];
  };
  errors: string[];
  durationMs: number;
}

interface Event {
  type: string;
  [k: string]: unknown;
}

export async function preflight(
  input: PreflightInput,
): Promise<PreflightSummary> {
  const baseUrl = input.apiUrl ?? DEFAULT_BASE_URL;
  const timeoutMs = input.timeoutMs ?? 45_000;
  const t0 = Date.now();

  const summary: PreflightSummary = {
    tokenId: input.tokenId,
    errors: [],
    durationMs: 0,
  };

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
    let done = false;

    while (!done) {
      const r = await reader.read();
      if (r.done) break;
      buffer += decoder.decode(r.value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";
      for (const frame of frames) {
        const dataLine = frame.split("\n").find((l) => l.startsWith("data:"));
        if (!dataLine) continue;
        try {
          const ev = JSON.parse(dataLine.slice(5).trim()) as Event;
          applyEvent(summary, ev);
        } catch {
          // skip
        }
        // Short-circuit once the migration phase is in.
        if (summary.migration) {
          done = true;
          break;
        }
      }
    }

    // Best-effort cancel of the upstream stream.
    try {
      await reader.cancel();
    } catch {
      // ignore
    }
  } catch (err) {
    summary.errors.push(err instanceof Error ? err.message : String(err));
  } finally {
    clearTimeout(timeout);
  }

  summary.durationMs = Date.now() - t0;
  return summary;
}

function applyEvent(s: PreflightSummary, ev: Event): void {
  if (ev.type !== "tool.result") return;
  const tool = ev["tool"] as string;
  const out = ev["output"] as Record<string, unknown> | undefined;
  if (!out) return;

  if (tool === "getV3Position") {
    s.position = {
      pair: String(out["pair"] ?? ""),
      tickLower: Number(out["tickLower"] ?? 0),
      tickUpper: Number(out["tickUpper"] ?? 0),
      liquidity: String(out["liquidity"] ?? ""),
    };
  } else if (tool === "buildMigrationPreview") {
    const targetHook = out["targetHook"] as Record<string, unknown> | undefined;
    const swapQuote = out["swapQuote"] as Record<string, unknown> | undefined;
    s.migration = {
      targetHookAddress: targetHook
        ? String(targetHook["address"] ?? "")
        : undefined,
      targetHookFamily: targetHook
        ? String(targetHook["family"] ?? "")
        : undefined,
      priceImpactPct: swapQuote
        ? Number(swapQuote["priceImpact"] ?? 0) * 100
        : undefined,
      slippageBps: swapQuote
        ? Math.round(Number(swapQuote["slippage"] ?? 0) * 10_000)
        : undefined,
      routingType: swapQuote ? String(swapQuote["routing"] ?? "") : undefined,
      warnings: (out["warnings"] as string[]) ?? [],
    };
  }
}

export const preflightToolDefinition = {
  name: "lpdoctor.preflight",
  description:
    "Preview a migration option for a Uniswap V3 LP position without committing to the full diagnostic. Returns the close→swap→mint plan, the target V4 hook, the swap quote (price impact + slippage), and any warnings.",
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
      timeoutMs: {
        type: "number",
        description: "Stream timeout in milliseconds (max 60 000).",
      },
    },
    required: ["tokenId"],
    additionalProperties: false,
  },
} as const;
