// @lpdoctor/agent — orchestrates the diagnostic pipeline (phases 1, 3,
// 4, 5, 6, 7, 10, 8, 9, 11 — phase 10 runs before 8 so the broker
// attestation is embedded in the report payload that 8 uploads).

export type { DiagnosticEvent } from "@lpdoctor/core";
export {
  resolveV3Position,
  type V3PositionFetcher,
  type V3SubgraphPosition,
} from "./phases/01-resolution/resolveV3.js";
export type {
  Phase1Output,
  Phase1Pool,
  Phase1Token,
} from "./phases/01-resolution/types.js";
export {
  computeCurrentAmounts,
  computeIL,
  type CurrentAmounts,
  type ILBreakdown,
} from "./phases/03-il/math.js";
export { computeFeatures } from "./phases/04-regime/features.js";
export { classify, describeRegime } from "./phases/04-regime/classify.js";
export type {
  Phase4Output,
  PoolHourPoint,
  RegimeFeatures,
  RegimeLabel,
  RegimeScores,
} from "./phases/04-regime/types.js";
export {
  decodeFlags,
  HOOK_FLAGS,
  type FlagName,
} from "./phases/05-hooks/flags.js";
export { classifyFamily } from "./phases/05-hooks/classify.js";
export type {
  HookCandidate,
  HookFamily,
  Phase5Output,
} from "./phases/05-hooks/types.js";
export { scoreHook } from "./phases/06-scoring/scoreHook.js";
export type {
  HookScoringMultipliers,
  HookScoringResult,
  Phase6Output,
} from "./phases/06-scoring/types.js";
export {
  buildMigrationPreview,
  type Quoter,
  type QuoteHop,
  type QuoteSummary,
} from "./phases/07-migration/buildPreview.js";
export type {
  MigrationPreview,
  MigrationStep,
  Phase7Output,
} from "./phases/07-migration/types.js";
export { assembleReport } from "./phases/08-report/assembleReport.js";
export type {
  AssembledReport,
  Phase8Output,
  ReportProvenance,
} from "./phases/08-report/types.js";
export type {
  AgentMemoryReceipt,
  AnchorReceipt,
  Phase9Output,
} from "./phases/09-anchor/types.js";
export { buildVerdictPrompt } from "./phases/10-verdict/buildPrompt.js";
export type {
  Phase10Output,
  VerdictPayload,
} from "./phases/10-verdict/types.js";
export type {
  EnsPublication,
  EnsRecord,
  Phase11Output,
} from "./phases/11-ens/types.js";
export {
  runPhase1,
  runPhase3,
  runPhase4,
  runPhase5,
  runPhase6,
  runPhase7,
  runPhase8,
  runPhase9,
  runPhase10,
  runPhase11,
  type AgentDeps,
  type Emit,
  type EnsPublisher,
  type Phase3Output,
  type PoolHourFetcher,
  type AgentMemoryUpdater,
  type ReportAnchorer,
  type ReportUploader,
  type V4HookedPoolRow,
  type V4HookedPoolsFetcher,
  type VerdictSynthesizer,
} from "./orchestrator.js";
