import { computed, emulated, estimated, labeled, verified } from "@lpdoctor/core";
import type { DiagnosticEvent, Labeled } from "@lpdoctor/core";
import {
  resolveV3Position,
  type V3PositionFetcher,
} from "./phases/01-resolution/resolveV3.js";
import type { Phase1Output } from "./phases/01-resolution/types.js";
import {
  computeCurrentAmounts,
  computeIL,
  type ILBreakdown,
} from "./phases/03-il/math.js";
import { computeFeatures } from "./phases/04-regime/features.js";
import {
  classify,
  describeRegime,
} from "./phases/04-regime/classify.js";
import type {
  Phase4Output,
  PoolHourPoint,
} from "./phases/04-regime/types.js";
import { classifyFamily } from "./phases/05-hooks/classify.js";
import type {
  HookCandidate,
  HookFamily,
  Phase5Output,
} from "./phases/05-hooks/types.js";
import { scoreHook } from "./phases/06-scoring/scoreHook.js";
import type {
  HookScoringResult,
  Phase6Output,
} from "./phases/06-scoring/types.js";
import {
  buildMigrationPreview,
  type Quoter,
} from "./phases/07-migration/buildPreview.js";
import type { MigrationPreview, Phase7Output } from "./phases/07-migration/types.js";
import { assembleReport } from "./phases/08-report/assembleReport.js";
import type {
  AssembledReport,
  Phase8Output,
  ReportProvenance,
} from "./phases/08-report/types.js";
import type {
  AgentMemoryReceipt,
  AnchorReceipt,
  Phase9Output,
} from "./phases/09-anchor/types.js";
import { buildVerdictPrompt } from "./phases/10-verdict/buildPrompt.js";
import { validateVerdict } from "./phases/10-verdict/validate.js";
import type {
  Phase10Output,
  VerdictPayload,
} from "./phases/10-verdict/types.js";
import type {
  EnsPublication,
  EnsRecord,
  Phase11Output,
} from "./phases/11-ens/types.js";

export type Emit = (event: DiagnosticEvent) => void;

export type PoolHourFetcher = (
  poolId: string,
  fromUnix: number,
) => Promise<PoolHourPoint[]>;

export interface V4HookedPoolRow {
  id: string;
  hooks: string;
  feeTier: string;
  tickSpacing: string;
  liquidity: string;
  totalValueLockedUSD: string;
  volumeUSD: string;
  token0: { id: string; symbol: string; decimals: string };
  token1: { id: string; symbol: string; decimals: string };
}

export type V4HookedPoolsFetcher = (
  token0: string,
  token1: string,
) => Promise<V4HookedPoolRow[]>;

export type ReportUploader = (
  report: AssembledReport,
) => Promise<Omit<ReportProvenance, "uploadedAt">>;

export type ReportAnchorer = (
  rootHash: string,
) => Promise<Omit<AnchorReceipt, "anchoredAt" | "rootHash">>;

export type AgentMemoryUpdater = (
  rootHash: string,
) => Promise<Omit<AgentMemoryReceipt, "updatedAt">>;

export type VerdictSynthesizer = (
  reportJson: string,
) => Promise<Omit<VerdictPayload, "generatedAt">>;

export type EnsPublisher = (args: {
  tokenId: string;
  rootHash: string;
  storageUrl: string;
  anchorTxHash?: string;
  chainId?: number;
  verdictExcerpt?: string;
}) => Promise<{
  parentName: string;
  subnameLabel: string;
  records: EnsRecord[];
  resolverAddress: string;
  network: "mainnet" | "sepolia";
  stub: boolean;
}>;

export interface AgentDeps {
  fetchV3Position: V3PositionFetcher;
  fetchPoolHourDatas?: PoolHourFetcher;
  fetchV4HookedPools?: V4HookedPoolsFetcher;
  quoteSwap?: Quoter;
  uploadReport?: ReportUploader;
  anchorReport?: ReportAnchorer;
  updateAgentMemory?: AgentMemoryUpdater;
  synthesizeVerdict?: VerdictSynthesizer;
  publishEns?: EnsPublisher;
}

export interface Phase3Output {
  hodlValueT1: Labeled<number>;
  lpValueT1: Labeled<number>;
  feesValueT1: Labeled<number>;
  ilT1: Labeled<number>;
  ilPct: Labeled<number>;
}

export async function runPhase1(
  tokenId: string,
  deps: AgentDeps,
  emit: Emit,
): Promise<Phase1Output> {
  const t0 = Date.now();
  emit({ type: "phase.start", phase: 1, label: "position resolution" });
  emit({ type: "tool.call", tool: "getV3Position", input: { tokenId } });

  const position = await resolveV3Position(tokenId, deps.fetchV3Position);

  emit({
    type: "tool.result",
    tool: "getV3Position",
    output: {
      pair: `${position.pool.value.token0.symbol}/${position.pool.value.token1.symbol}`,
      token0: position.pool.value.token0.address,
      token1: position.pool.value.token1.address,
      tickLower: position.tickLower.value,
      tickUpper: position.tickUpper.value,
      liquidity: position.liquidity.value,
    },
    latencyMs: Date.now() - t0,
  });
  emit({
    type: "narrative",
    text: `Found ${position.pool.value.token0.symbol}/${position.pool.value.token1.symbol} V${position.version} position with liquidity ${position.liquidity.value}.`,
  });
  emit({ type: "phase.end", phase: 1, durationMs: Date.now() - t0 });

  return position;
}

export async function runPhase3(
  position: Phase1Output,
  emit: Emit,
): Promise<Phase3Output> {
  const t0 = Date.now();
  emit({ type: "phase.start", phase: 3, label: "il reconstruction" });
  emit({ type: "tool.call", tool: "computeIL", input: { tokenId: position.tokenId } });

  const pool = position.pool.value;
  const amounts = computeCurrentAmounts({
    liquidity: position.liquidity.value,
    tickLower: position.tickLower.value,
    tickUpper: position.tickUpper.value,
    currentTick: pool.tick,
    sqrtPriceX96: pool.sqrtPriceX96,
  });

  const il: ILBreakdown = computeIL({
    depositedToken0: position.depositedToken0.value,
    depositedToken1: position.depositedToken1.value,
    collectedFeesToken0: position.collectedFeesToken0.value,
    collectedFeesToken1: position.collectedFeesToken1.value,
    currentAmount0Raw: amounts.amount0,
    currentAmount1Raw: amounts.amount1,
    token0Decimals: pool.token0.decimals,
    token1Decimals: pool.token1.decimals,
    token0Price: pool.token0Price,
  });

  emit({
    type: "tool.result",
    tool: "computeIL",
    output: il,
    latencyMs: Date.now() - t0,
  });
  emit({
    type: "narrative",
    text: `Impermanent loss: ${il.ilT1.toFixed(4)} ${pool.token1.symbol} (${(il.ilPct * 100).toFixed(2)}%) vs HODL. Fees collected so far: ${il.feesValueT1.toFixed(4)} ${pool.token1.symbol}.`,
  });
  emit({ type: "phase.end", phase: 3, durationMs: Date.now() - t0 });

  return {
    hodlValueT1: computed(il.hodlValueT1, "uniswap-v3-whitepaper-eq-6.29-6.30"),
    lpValueT1: computed(il.lpValueT1, "uniswap-v3-whitepaper-eq-6.29-6.30"),
    feesValueT1: computed(il.feesValueT1, "uniswap-v3-subgraph-collected-fees"),
    ilT1: computed(il.ilT1, "uniswap-v3-whitepaper-eq-6.29-6.30"),
    ilPct: computed(il.ilPct, "uniswap-v3-whitepaper-eq-6.29-6.30"),
  };
}

const DEFAULT_LOOKBACK_HOURS = 30 * 24;

export async function runPhase4(
  position: Phase1Output,
  deps: AgentDeps,
  emit: Emit,
): Promise<Phase4Output | null> {
  if (!deps.fetchPoolHourDatas) {
    emit({
      type: "narrative",
      text: "Skipping regime classification — no pool history fetcher configured.",
    });
    return null;
  }

  const t0 = Date.now();
  emit({ type: "phase.start", phase: 4, label: "regime classification" });
  const fromUnix =
    Math.floor(Date.now() / 1000) - DEFAULT_LOOKBACK_HOURS * 3600;
  emit({
    type: "tool.call",
    tool: "fetchPoolHourDatas",
    input: { pool: position.pool.value.address, fromUnix },
  });

  const points = await deps.fetchPoolHourDatas(
    position.pool.value.address,
    fromUnix,
  );

  emit({
    type: "tool.result",
    tool: "fetchPoolHourDatas",
    output: { hours: points.length },
    latencyMs: Date.now() - t0,
  });

  const features = computeFeatures(points);
  const { scores, topLabel, confidence } = classify(features);
  const narrative = describeRegime({ topLabel, confidence, features });

  emit({
    type: "tool.result",
    tool: "classifyRegime",
    output: { topLabel, confidence, scores, features },
    latencyMs: Date.now() - t0,
  });
  emit({ type: "narrative", text: narrative });
  emit({ type: "phase.end", phase: 4, durationMs: Date.now() - t0 });

  return {
    features: estimated(features, confidence, "regime-heuristic-v0"),
    scores: estimated(scores, confidence, "regime-heuristic-v0"),
    topLabel: estimated(topLabel, confidence, "regime-heuristic-v0"),
    confidence: estimated(confidence, confidence, "regime-heuristic-v0"),
    narrative,
  };
}

export async function runPhase5(
  position: Phase1Output,
  deps: AgentDeps,
  emit: Emit,
): Promise<Phase5Output | null> {
  if (!deps.fetchV4HookedPools) {
    emit({
      type: "narrative",
      text: "Skipping hook discovery — no v4 hooks fetcher configured.",
    });
    return null;
  }

  const pool = position.pool.value;
  const pair = `${pool.token0.symbol}/${pool.token1.symbol}`;
  const t0 = Date.now();
  emit({ type: "phase.start", phase: 5, label: "v4 hook discovery" });
  emit({
    type: "tool.call",
    tool: "discoverV4Hooks",
    input: { token0: pool.token0.address, token1: pool.token1.address },
  });

  const rows = await deps.fetchV4HookedPools(
    pool.token0.address,
    pool.token1.address,
  );

  const candidates: HookCandidate[] = rows.map((r) => {
    const { family, bitmap, active } = classifyFamily(r.hooks);
    return {
      poolId: r.id,
      hookAddress: r.hooks,
      family,
      flagsBitmap: bitmap,
      activeFlags: active,
      feeTier: parseInt(r.feeTier, 10),
      tickSpacing: parseInt(r.tickSpacing, 10),
      tvlUsd: parseFloat(r.totalValueLockedUSD || "0"),
      volumeUsd: parseFloat(r.volumeUSD || "0"),
      pair,
    };
  });

  const tvlByFamily = new Map<HookFamily, number>();
  for (const c of candidates) {
    tvlByFamily.set(c.family, (tvlByFamily.get(c.family) ?? 0) + c.tvlUsd);
  }
  let topFamily: HookFamily = "UNKNOWN";
  let topFamilyTvl = -1;
  for (const [fam, tvl] of tvlByFamily) {
    if (tvl > topFamilyTvl) {
      topFamily = fam;
      topFamilyTvl = tvl;
    }
  }

  emit({
    type: "tool.result",
    tool: "discoverV4Hooks",
    output: { candidates, topFamily, count: candidates.length },
    latencyMs: Date.now() - t0,
  });

  if (candidates.length === 0) {
    emit({
      type: "narrative",
      text: `No active V4 hooks found for ${pair} on mainnet.`,
    });
  } else {
    emit({
      type: "narrative",
      text: `Found ${candidates.length} V4 hook(s) on ${pair}; top family: ${topFamily.toLowerCase().replace(/_/g, "-")}.`,
    });
  }
  emit({ type: "phase.end", phase: 5, durationMs: Date.now() - t0 });

  return {
    pair,
    candidates: labeled(candidates, "v4-subgraph + flag-bitmap-heuristic"),
    topFamily: labeled(topFamily, "tvl-weighted-family-vote"),
  };
}

const SCORING_LOOKBACK_HOURS = 30 * 24;

export async function runPhase6(
  position: Phase1Output,
  inputs: {
    regime: Phase4Output | null;
    hooks: Phase5Output | null;
    il: Phase3Output | null;
  },
  deps: AgentDeps,
  emit: Emit,
): Promise<Phase6Output | null> {
  if (!deps.fetchPoolHourDatas) {
    emit({
      type: "narrative",
      text: "Skipping hook scoring — no pool history fetcher configured.",
    });
    return null;
  }
  if (!inputs.hooks || inputs.hooks.candidates.value.length === 0) {
    emit({
      type: "narrative",
      text: "Skipping hook scoring — no candidate hooks discovered.",
    });
    return null;
  }
  if (!inputs.regime) {
    emit({
      type: "narrative",
      text: "Skipping hook scoring — regime classification unavailable.",
    });
    return null;
  }

  const t0 = Date.now();
  emit({ type: "phase.start", phase: 6, label: "v4 hook scoring" });

  // Pick the top hook by TVL — same heuristic as phase 5 narrative.
  // Note: phase 6 is "scoring" (family multipliers), not "replay"
  // (swap-by-swap EVM state). The naming was deliberately tightened —
  // every claim downstream traces back to multipliers + history vol/tier.
  const candidates = inputs.hooks.candidates.value;
  const top = candidates.reduce(
    (best, c) => (c.tvlUsd > best.tvlUsd ? c : best),
    candidates[0],
  );

  emit({
    type: "tool.call",
    tool: "scoreHook",
    input: { hook: top.hookAddress, family: top.family },
  });

  const fromUnix =
    Math.floor(Date.now() / 1000) - SCORING_LOOKBACK_HOURS * 3600;
  const history = await deps.fetchPoolHourDatas(
    position.pool.value.address,
    fromUnix,
  );

  const baselineIlPct = inputs.il?.ilPct.value ?? 0;

  const result: HookScoringResult = scoreHook({
    hook: top,
    feeTierPpm: position.pool.value.feeTier,
    features: inputs.regime.features.value,
    history,
    baselineIlPct,
  });

  emit({
    type: "tool.result",
    tool: "scoreHook",
    output: result,
    latencyMs: Date.now() - t0,
  });

  emit({
    type: "narrative",
    text:
      result.deltaAprPct > 0
        ? `Scored ${result.family.toLowerCase().replace(/_/g, "-")} hook against ${result.hoursScored}h of pool data: heuristic APR ${result.simulatedAprPct.toFixed(2)}% (Δ ${result.deltaAprPct >= 0 ? "+" : ""}${result.deltaAprPct.toFixed(2)} pts vs baseline).`
        : `Scored ${result.family.toLowerCase().replace(/_/g, "-")} hook: APR delta is ${result.deltaAprPct.toFixed(2)} pts; this family is not predicted to improve LP economics in the current regime.`,
  });
  emit({ type: "phase.end", phase: 6, durationMs: Date.now() - t0 });

  return {
    result: emulated(result, [
      "Phase 6 is a heuristic scoring step, not a swap-by-swap EVM replay. Family multipliers are calibrated against a 30-day pool sample; the simulated APR is directional, not a forecast.",
      ...result.warnings,
    ]),
  };
}

export async function runPhase7(
  position: Phase1Output,
  hookResult: Phase5Output | null,
  deps: AgentDeps,
  emit: Emit,
): Promise<Phase7Output | null> {
  if (!deps.quoteSwap) {
    emit({
      type: "narrative",
      text: "Skipping migration preview — no swap quoter configured.",
    });
    return null;
  }

  const t0 = Date.now();
  emit({ type: "phase.start", phase: 7, label: "migration preview" });
  emit({
    type: "tool.call",
    tool: "buildMigrationPreview",
    input: { tokenId: position.tokenId },
  });

  const candidates = hookResult?.candidates.value ?? [];
  const preview = await buildMigrationPreview({
    position,
    hookCandidates: candidates,
    quoter: deps.quoteSwap,
  });

  emit({
    type: "tool.result",
    tool: "buildMigrationPreview",
    output: preview,
    latencyMs: Date.now() - t0,
  });

  if (preview.targetHook && preview.swapQuote) {
    emit({
      type: "narrative",
      text: `Migration preview: close → swap (impact ${(preview.swapQuote.priceImpact * 100).toFixed(3)}%) → mint into ${preview.targetHook.family.toLowerCase().replace(/_/g, "-")} hook.`,
    });
  } else {
    emit({
      type: "narrative",
      text: `Migration preview built with limited data — see warnings.`,
    });
  }
  emit({ type: "phase.end", phase: 7, durationMs: Date.now() - t0 });

  // When the swap quote came back live from the Trading API, the numbers
  // shown in the preview (price impact, gas fee, route, output amount)
  // are computed from real Uniswap routing — only the `close → swap →
  // mint` sequence as a whole is hypothetical (the agent never executes).
  // Surface that distinction with COMPUTED + the existing warnings list,
  // and reserve EMULATED for the no-quote fallback.
  const previewLabel: Labeled<MigrationPreview> = preview.swapQuote
    ? {
        value: preview,
        label: "COMPUTED",
        source: "uniswap-trading-api-v1-quote + permit2-eip712-bundle",
        warnings: preview.warnings,
      }
    : emulated(preview, preview.warnings);

  return {
    preview: previewLabel,
  };
}

export async function runPhase8(
  position: Phase1Output,
  outputs: {
    il: Phase3Output | null;
    regime: Phase4Output | null;
    hooks: Phase5Output | null;
    migration: Phase7Output | null;
    verdict?: Phase10Output | null;
  },
  deps: AgentDeps,
  emit: Emit,
): Promise<Phase8Output | null> {
  if (!deps.uploadReport) {
    emit({
      type: "narrative",
      text: "Skipping report upload — no storage uploader configured.",
    });
    return null;
  }

  const t0 = Date.now();
  emit({ type: "phase.start", phase: 8, label: "report assembly + storage" });
  emit({
    type: "tool.call",
    tool: "assembleReport",
    input: { tokenId: position.tokenId },
  });

  const report = assembleReport({
    position,
    il: outputs.il,
    regime: outputs.regime,
    hooks: outputs.hooks,
    migration: outputs.migration,
    verdict: outputs.verdict,
  });

  emit({
    type: "tool.result",
    tool: "assembleReport",
    output: { schemaVersion: report.schemaVersion, sections: Object.keys(report) },
    latencyMs: Date.now() - t0,
  });

  emit({
    type: "tool.call",
    tool: "uploadReportToOgStorage",
    input: { rootCandidate: "pending" },
  });

  const t1 = Date.now();
  const partial = await deps.uploadReport(report);
  const provenance: ReportProvenance = {
    ...partial,
    uploadedAt: new Date().toISOString(),
  };

  emit({
    type: "tool.result",
    tool: "uploadReportToOgStorage",
    output: provenance,
    latencyMs: Date.now() - t1,
  });

  emit({
    type: "report.uploaded",
    rootHash: provenance.rootHash,
    storageUrl: provenance.storageUrl,
  });

  emit({
    type: "narrative",
    text: provenance.stub
      ? `Report assembled (${provenance.size} bytes). 0G Storage upload skipped — emitting deterministic stub hash ${provenance.rootHash.slice(0, 14)}…`
      : `Report uploaded to 0G Storage. rootHash ${provenance.rootHash.slice(0, 14)}…`,
  });
  emit({ type: "phase.end", phase: 8, durationMs: Date.now() - t0 });

  return {
    report: provenance.stub
      ? emulated(report, ["report uploaded as deterministic stub — 0G storage signing key not configured"])
      : verified(report, "0g-storage-merkle-root"),
    provenance: provenance.stub
      ? emulated(provenance, ["stub hash — not anchored on 0G Storage"])
      : verified(provenance, "0g-storage-merkle-root"),
  };
}

export async function runPhase9(
  storageResult: Phase8Output | null,
  deps: AgentDeps,
  emit: Emit,
): Promise<Phase9Output | null> {
  if (!storageResult) {
    emit({
      type: "narrative",
      text: "Skipping chain anchor — no storage rootHash to anchor.",
    });
    return null;
  }
  if (!deps.anchorReport) {
    emit({
      type: "narrative",
      text: "Skipping chain anchor — no anchor signer configured.",
    });
    return null;
  }

  const rootHash = storageResult.provenance.value.rootHash;
  const t0 = Date.now();
  emit({ type: "phase.start", phase: 9, label: "0g chain anchor" });
  emit({
    type: "tool.call",
    tool: "anchorRootHashOnOgChain",
    input: { rootHash },
  });

  const partial = await deps.anchorReport(rootHash);
  const receipt: AnchorReceipt = {
    ...partial,
    rootHash,
    anchoredAt: new Date().toISOString(),
  };

  emit({
    type: "tool.result",
    tool: "anchorRootHashOnOgChain",
    output: receipt,
    latencyMs: Date.now() - t0,
  });

  emit({
    type: "report.anchored",
    txHash: receipt.txHash,
    chainId: receipt.chainId,
  });

  emit({
    type: "narrative",
    text: receipt.stub
      ? `Chain anchor skipped — emitting deterministic stub txHash ${receipt.txHash.slice(0, 14)}…`
      : `Anchored on 0G Chain (id ${receipt.chainId}). tx ${receipt.txHash.slice(0, 14)}…`,
  });

  // Phase 9b — agent iNFT memory anchor + reputation increment. Best-
  // effort: any failure here is reflected in the labeled output's
  // warnings, but does NOT fail the diagnose run. Skipped when the
  // agent's iNFT contract / tokenId / signing key isn't configured, OR
  // when the report-anchor step itself stubbed (no point burning a
  // memory tx for a stubbed root).
  let agentMemory: Phase9Output["agentMemory"];
  if (deps.updateAgentMemory && !receipt.stub) {
    const tMem = Date.now();
    emit({
      type: "tool.call",
      tool: "updateAgentMemoryRoot",
      input: { rootHash },
    });
    const memPartial = await deps.updateAgentMemory(rootHash);
    const memReceipt: AgentMemoryReceipt = {
      ...memPartial,
      updatedAt: new Date().toISOString(),
    };
    emit({
      type: "tool.result",
      tool: "updateAgentMemoryRoot",
      output: memReceipt,
      latencyMs: Date.now() - tMem,
    });
    if (!memReceipt.stub) {
      emit({
        type: "narrative",
        text: `Agent iNFT memory updated: tokenId ${memReceipt.tokenId} memoryRoot ${memReceipt.memoryRoot.slice(0, 14)}… reputation ${memReceipt.reputation}.`,
      });
    } else {
      emit({
        type: "narrative",
        text: `iNFT memory update skipped — see warnings.`,
      });
    }
    agentMemory = memReceipt.stub
      ? emulated(memReceipt, memReceipt.warnings)
      : verified(memReceipt, `0g-chain-${memReceipt.contract}`);
  }

  emit({ type: "phase.end", phase: 9, durationMs: Date.now() - t0 });

  return {
    anchor: receipt.stub
      ? emulated(receipt, ["stub anchor — 0G chain signing key not configured"])
      : verified(receipt, `0g-chain-${receipt.chainId}`),
    agentMemory,
  };
}

export async function runPhase10(
  draftReport: AssembledReport | null,
  deps: AgentDeps,
  emit: Emit,
): Promise<Phase10Output | null> {
  if (!draftReport) {
    emit({
      type: "narrative",
      text: "Skipping verdict synthesis — no report to summarize.",
    });
    return null;
  }
  if (!deps.synthesizeVerdict) {
    emit({
      type: "narrative",
      text: "Skipping verdict synthesis — no 0G compute synthesizer configured.",
    });
    return null;
  }

  const t0 = Date.now();
  emit({ type: "phase.start", phase: 10, label: "0g compute verdict" });
  emit({
    type: "tool.call",
    tool: "synthesizeVerdict",
    input: { schemaVersion: draftReport.schemaVersion },
  });

  const prompt = buildVerdictPrompt(draftReport);
  const partial = await deps.synthesizeVerdict(prompt);

  // AT-4 hallucination guard: every numeric / hex claim in the verdict
  // must trace back to the structured report payload (within ±2%).
  // Unsupported claims are masked with `[unsupported]` and the
  // mismatches are pushed into the warnings array attached to the
  // EMULATED label downstream.
  const validation = validateVerdict(partial.markdown, draftReport);

  const payload: VerdictPayload = {
    ...partial,
    markdown: validation.markdown,
    generatedAt: new Date().toISOString(),
  };

  emit({
    type: "tool.result",
    tool: "synthesizeVerdict",
    output: {
      model: payload.model,
      providerAddress: payload.providerAddress,
      stub: payload.stub,
      latencyMs: payload.latencyMs,
      chars: payload.markdown.length,
    },
    latencyMs: Date.now() - t0,
  });

  emit({
    type: "verdict.final",
    markdown: payload.markdown,
    labels: {
      model: payload.model,
      provider: payload.providerAddress ?? "stub",
      label: payload.stub ? "EMULATED" : "ESTIMATED",
    },
  });

  emit({
    type: "narrative",
    text: payload.stub
      ? `Verdict synthesis skipped — emitting deterministic stub.`
      : `Verdict synthesized via 0G Compute (${payload.model}) in ${payload.latencyMs}ms.`,
  });
  emit({ type: "phase.end", phase: 10, durationMs: Date.now() - t0 });

  const verdictWarnings: string[] = [];
  if (payload.stub) {
    verdictWarnings.push(
      "verdict synthesized as deterministic stub — 0G compute not configured",
    );
  }
  if (validation.flagged > 0) {
    verdictWarnings.push(
      `${validation.flagged} unsupported claim(s) in verdict masked with [unsupported] — see hallucinationFlags.`,
    );
    verdictWarnings.push(...validation.warnings);
  }

  return {
    verdict:
      payload.stub || validation.flagged > 0
        ? emulated(payload, verdictWarnings)
        : estimated(payload, 0.7, `0g-compute-${payload.model}`),
  };
}

export async function runPhase11(
  position: Phase1Output,
  outputs: {
    storage: Phase8Output | null;
    anchor: Phase9Output | null;
    verdict: Phase10Output | null;
  },
  deps: AgentDeps,
  emit: Emit,
): Promise<Phase11Output | null> {
  if (!deps.publishEns) {
    emit({
      type: "narrative",
      text: "Skipping ENS publish — no ENS publisher configured.",
    });
    return null;
  }
  if (!outputs.storage) {
    emit({
      type: "narrative",
      text: "Skipping ENS publish — no storage rootHash to anchor.",
    });
    return null;
  }

  const t0 = Date.now();
  emit({ type: "phase.start", phase: 11, label: "ens identity publish" });
  emit({
    type: "tool.call",
    tool: "publishEnsRecords",
    input: { tokenId: position.tokenId },
  });

  const provenance = outputs.storage.provenance.value;
  const anchor = outputs.anchor?.anchor.value;
  const verdict = outputs.verdict?.verdict.value;

  const result = await deps.publishEns({
    tokenId: position.tokenId,
    rootHash: provenance.rootHash,
    storageUrl: provenance.storageUrl,
    anchorTxHash: anchor?.txHash,
    chainId: anchor?.chainId,
    verdictExcerpt: verdict?.markdown,
  });

  const fullName = `${result.subnameLabel}.${result.parentName}`;
  const resolverUrl =
    result.network === "mainnet"
      ? `https://app.ens.domains/${result.parentName}`
      : `https://sepolia.app.ens.domains/${result.parentName}`;
  const publication: EnsPublication = {
    ...result,
    fullName,
    resolverUrl,
    publishedAt: new Date().toISOString(),
  };

  emit({
    type: "tool.result",
    tool: "publishEnsRecords",
    output: publication,
    latencyMs: Date.now() - t0,
  });

  emit({
    type: "narrative",
    text: result.stub
      ? `ENS publish skipped — would have written ${result.records.length} text records under ${result.parentName}.`
      : `ENS records published — ${result.records.length} keys live on ${result.network} under ${result.parentName}.`,
  });
  emit({ type: "phase.end", phase: 11, durationMs: Date.now() - t0 });

  return {
    ens: result.stub
      ? emulated(publication, ["ENS records prepared as stub — set ENS_PARENT_PRIVATE_KEY to publish"])
      : verified(publication, `ens-${result.network}`),
  };
}
