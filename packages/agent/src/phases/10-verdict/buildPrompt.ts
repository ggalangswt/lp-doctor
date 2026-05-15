import type { AssembledReport } from "../08-report/types.js";

// Trims the report into a compact JSON string for the verdict LLM call.
// We deliberately omit any field that contains addresses or hashes the
// LLM might hallucinate; the report payload is already structured + bounded.

export function buildVerdictPrompt(report: AssembledReport): string {
  const compact = {
    schemaVersion: report.schemaVersion,
    position: report.position,
    il: report.il,
    regime: report.regime,
    hooks: report.hooks,
    migration: report.migration,
  };
  return JSON.stringify(compact);
}
