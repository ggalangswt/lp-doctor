import { useEffect, useState } from "react";

export interface PublicReport {
  rootHash: string;
  storageUrl: string;
  anchorTxHash?: string;
  anchorChainId?: number;
  storageStub: boolean;
  anchorStub?: boolean;
  cachedAt: string;
  payload: AssembledReportPayload;
}

export interface AssembledReportPayload {
  schemaVersion: number;
  generatedAt: string;
  agent: { name: string; version: string };
  position: {
    tokenId: string;
    version: 3 | 4;
    pair: string;
    owner: string;
  };
  il?: {
    hodlValueT1: number;
    lpValueT1: number;
    feesValueT1: number;
    ilT1: number;
    ilPct: number;
  };
  regime?: { topLabel: string; confidence: number; narrative: string };
  hooks?: { pair: string; topFamily: string; candidateCount: number };
  migration?: {
    targetHookAddress?: string;
    targetFamily?: string;
    priceImpactPct?: number;
    warnings: string[];
  };
}

type Status = "idle" | "loading" | "ready" | "error";

export function useReport(rootHash: string | null) {
  const [status, setStatus] = useState<Status>(rootHash ? "loading" : "idle");
  const [report, setReport] = useState<PublicReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rootHash) return;
    const ctrl = new AbortController();
    setStatus("loading");
    setError(null);

    fetch(`/api/report/${rootHash}`, { signal: ctrl.signal })
      .then(async (res) => {
        if (res.status === 404) {
          setStatus("error");
          setError("Report not found in cache.");
          return;
        }
        if (!res.ok) {
          setStatus("error");
          setError(`HTTP ${res.status}`);
          return;
        }
        const json = (await res.json()) as PublicReport;
        setReport(json);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setStatus("error");
        setError(err instanceof Error ? err.message : String(err));
      });

    return () => ctrl.abort();
  }, [rootHash]);

  return { status, report, error };
}
