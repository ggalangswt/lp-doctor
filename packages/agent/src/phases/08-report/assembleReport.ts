import type { Phase1Output } from "../01-resolution/types.js";
import type { Phase4Output } from "../04-regime/types.js";
import type { Phase5Output } from "../05-hooks/types.js";
import type { Phase7Output } from "../07-migration/types.js";
import type { Phase10Output } from "../10-verdict/types.js";
import type { Phase3Output } from "../../orchestrator.js";
import type { AssembledReport, VerdictAttestation } from "./types.js";

const AGENT_VERSION = "0.7.0-storage";

export function assembleReport(args: {
  position: Phase1Output;
  il: Phase3Output | null;
  regime: Phase4Output | null;
  hooks: Phase5Output | null;
  migration: Phase7Output | null;
  verdict?: Phase10Output | null;
}): AssembledReport {
  const pool = args.position.pool.value;
  const pair = `${pool.token0.symbol}/${pool.token1.symbol}`;

  const report: AssembledReport = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    agent: { name: "lpdoctor", version: AGENT_VERSION },
    position: {
      tokenId: args.position.tokenId,
      version: args.position.version,
      pair,
      owner: args.position.owner.value,
    },
  };

  if (args.il) {
    report.il = {
      hodlValueT1: args.il.hodlValueT1.value,
      lpValueT1: args.il.lpValueT1.value,
      feesValueT1: args.il.feesValueT1.value,
      ilT1: args.il.ilT1.value,
      ilPct: args.il.ilPct.value,
    };
  }

  if (args.regime) {
    report.regime = {
      topLabel: args.regime.topLabel.value,
      confidence: args.regime.confidence.value,
      narrative: args.regime.narrative,
    };
  }

  if (args.hooks) {
    report.hooks = {
      pair: args.hooks.pair,
      topFamily: args.hooks.topFamily.value,
      candidateCount: args.hooks.candidates.value.length,
    };
  }

  if (args.migration) {
    const preview = args.migration.preview.value;
    report.migration = {
      targetHookAddress: preview.targetHook?.address,
      targetFamily: preview.targetHook?.family,
      priceImpactPct: preview.swapQuote
        ? preview.swapQuote.priceImpact * 100
        : undefined,
      warnings: preview.warnings,
    };
  }

  if (args.verdict) {
    const v = args.verdict.verdict.value;
    const attestation: VerdictAttestation = {
      type: "0g-compute-broker-signature",
      provider: v.providerAddress ?? "stub",
      model: v.model,
      generatedAt: v.generatedAt,
      stub: v.stub,
    };
    report.attestation = attestation;
  }

  return report;
}
