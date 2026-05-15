// lpdoctor.lookupReport — fetches a permanent report by its 0G Storage
// rootHash. Backed by the server-side cache; falls back to the public
// /api/report/:rootHash endpoint. Calling agents use this to verify
// what an LPDoctor diagnose actually committed for a given position.

import { z } from "zod";

const DEFAULT_BASE_URL =
  process.env.LPDOCTOR_API_URL ??
  process.env.LPLENS_API_URL ??
  "https://lpdoctor.xyz";

export const lookupReportInputSchema = z.object({
  rootHash: z.string().min(4),
  apiUrl: z.string().url().optional(),
});

export type LookupReportInput = z.infer<typeof lookupReportInputSchema>;

export interface LookupReportResult {
  found: boolean;
  rootHash: string;
  storageUrl?: string;
  anchorTxHash?: string;
  anchorChainId?: number;
  storageStub?: boolean;
  anchorStub?: boolean;
  cachedAt?: string;
  payload?: unknown;
  error?: string;
}

export async function lookupReport(
  input: LookupReportInput,
): Promise<LookupReportResult> {
  const baseUrl = input.apiUrl ?? DEFAULT_BASE_URL;
  try {
    const res = await fetch(`${baseUrl}/api/report/${input.rootHash}`);
    if (res.status === 404) {
      return { found: false, rootHash: input.rootHash };
    }
    if (!res.ok) {
      return {
        found: false,
        rootHash: input.rootHash,
        error: `HTTP ${res.status}`,
      };
    }
    const json = (await res.json()) as Record<string, unknown>;
    return {
      found: true,
      rootHash: String(json["rootHash"] ?? input.rootHash),
      storageUrl: json["storageUrl"] as string | undefined,
      anchorTxHash: json["anchorTxHash"] as string | undefined,
      anchorChainId: json["anchorChainId"] as number | undefined,
      storageStub: json["storageStub"] as boolean | undefined,
      anchorStub: json["anchorStub"] as boolean | undefined,
      cachedAt: json["cachedAt"] as string | undefined,
      payload: json["payload"],
    };
  } catch (err) {
    return {
      found: false,
      rootHash: input.rootHash,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export const lookupReportToolDefinition = {
  name: "lpdoctor.lookupReport",
  description:
    "Fetch a permanent LPDoctor report by its 0G Storage rootHash. Returns the full payload (position, IL, regime, hooks, migration plan) plus provenance (storage URL, chain anchor txHash, chainId). 404 if the hash is unknown to the cache.",
  inputSchema: {
    type: "object",
    properties: {
      rootHash: {
        type: "string",
        description: "Merkle rootHash returned by phase 8 (e.g. 0x... or 0xstub...).",
      },
      apiUrl: {
        type: "string",
        description: "LPDoctor API URL. Defaults to LPDOCTOR_API_URL or https://lpdoctor.xyz.",
      },
    },
    required: ["rootHash"],
    additionalProperties: false,
  },
} as const;
