// Phase 10 — Verdict Synthesis (LLM via 0G Compute).
// Wraps an LLM-streamed verdict around the structured report from phase
// 8. The output is rendered as `verdict.final` markdown so the frontend
// can show a TEE-attested narrative summary at the bottom of the
// diagnose page.

import type { Labeled } from "@lpdoctor/core";

export interface VerdictPayload {
  markdown: string;
  model: string;
  providerAddress?: string;
  stub: boolean;
  latencyMs: number;
  generatedAt: string;
}

export interface Phase10Output {
  verdict: Labeled<VerdictPayload>;
}
