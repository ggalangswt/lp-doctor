// AT-4 — LLM hallucination validator. After phase 10 returns the
// verdict markdown from a TEE-attested provider, we extract every
// claim that *could* be a hallucination — dollar amounts, percentages,
// hex addresses — and check whether each one appears (within a small
// tolerance) in the structured report JSON the LLM was asked to
// summarize. Unsupported claims are masked with `[unsupported]` and
// recorded in a warnings array so the EMULATED label honestly reflects
// the gap.

import type { AssembledReport } from "../08-report/types.js";

export interface VerdictValidation {
  markdown: string;
  warnings: string[];
  flagged: number;
}

const NUMERIC_PATTERN =
  /-?\$?\s?[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?\s?%?/g;
const HEX_PATTERN = /0x[a-fA-F0-9]{6,}/g;

function tokenize(s: string): string[] {
  // strip leading/trailing punctuation and currency symbols, normalize commas
  return s
    .toLowerCase()
    .replace(/[$,\s]/g, "")
    .replace(/[%]/g, "")
    .split(/[^0-9a-f.x-]+/)
    .filter((t) => t.length > 0);
}

function reportHaystack(report: AssembledReport): string {
  return JSON.stringify(report).toLowerCase();
}

function parseAsNumber(token: string): number | null {
  const cleaned = token.replace(/[$,%\s]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function findInHaystack(token: string, haystack: string): boolean {
  const cleaned = token.toLowerCase().replace(/[$,%\s]/g, "");
  if (cleaned.length === 0) return true;
  // Exact substring match handles addresses + decimal numbers verbatim.
  if (haystack.includes(cleaned)) return true;
  // Numeric tolerance: allow ±2% for figures the LLM rounded.
  const n = parseAsNumber(cleaned);
  if (n === null || n === 0) return false;
  // Walk all candidate numbers in the haystack; tolerate ±2%.
  const matches = haystack.match(/-?\d+(?:\.\d+)?/g) ?? [];
  for (const m of matches) {
    const candidate = parseFloat(m);
    if (!Number.isFinite(candidate) || candidate === 0) continue;
    const diff = Math.abs(candidate - n) / Math.max(Math.abs(candidate), Math.abs(n));
    if (diff < 0.02) return true;
  }
  return false;
}

export function validateVerdict(
  markdown: string,
  report: AssembledReport,
): VerdictValidation {
  const haystack = reportHaystack(report);
  const warnings: string[] = [];
  const seen = new Set<string>();
  let flagged = 0;

  let out = markdown;

  const replace = (match: string): string => {
    const cleaned = match.trim();
    const key = cleaned.toLowerCase();
    if (seen.has(key)) return cleaned;
    seen.add(key);
    if (findInHaystack(cleaned, haystack)) return cleaned;
    flagged += 1;
    warnings.push(
      `Claim "${cleaned}" in the verdict does not appear (within ±2%) in the report payload.`,
    );
    return "[unsupported]";
  };

  out = out.replace(HEX_PATTERN, (m) => replace(m));
  out = out.replace(NUMERIC_PATTERN, (m) => replace(m));

  return { markdown: out, warnings, flagged };
}

// Re-exported for tests.
export const __internal = { tokenize, findInHaystack, parseAsNumber };
