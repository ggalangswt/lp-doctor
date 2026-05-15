import { useParams } from "react-router-dom";
import { AppHeader } from "../components/AppHeader.js";
import { ILPanel, type ILBreakdown } from "../components/ILPanel.js";
import {
  HooksPanel,
  type HookDiscoveryResult,
} from "../components/HooksPanel.js";
import { LabelBadge } from "../components/LabelBadge.js";
import {
  MigrationPanel,
  type MigrationPreview,
} from "../components/MigrationPanel.js";
import {
  RegimePanel,
  type RegimeClassification,
} from "../components/RegimePanel.js";
import {
  ReportProvenancePanel,
  type ReportAnchor,
  type ReportProvenance,
} from "../components/ReportProvenancePanel.js";
import { ToolCallBadge } from "../components/ToolCallBadge.js";
import { TypewriterText } from "../components/TypewriterText.js";
import {
  VerdictPanel,
  type VerdictMeta,
} from "../components/VerdictPanel.js";
import {
  EnsPanel,
  type EnsPublication,
} from "../components/EnsPanel.js";
import {
  HookScoringPanel,
  type HookScoringResult,
} from "../components/HookScoringPanel.js";
import { useDiagnosticStream } from "../hooks/useDiagnosticStream.js";
import type { DiagnosticEvent } from "@lpdoctor/core";

type ToolEvent = Extract<
  DiagnosticEvent,
  { type: "tool.call" } | { type: "tool.result" }
>;

interface ResolvedPositionOutput {
  pair: string;
  tickLower: number;
  tickUpper: number;
  liquidity: string;
}

function pickToolResult<T>(events: DiagnosticEvent[], tool: string): T | null {
  const ev = events.find(
    (e) => e.type === "tool.result" && e.tool === tool,
  ) as Extract<DiagnosticEvent, { type: "tool.result" }> | undefined;
  return ev ? (ev.output as T) : null;
}

function pickReportUploaded(events: DiagnosticEvent[]): ReportProvenance | null {
  const ev = events.find((e) => e.type === "report.uploaded") as
    | Extract<DiagnosticEvent, { type: "report.uploaded" }>
    | undefined;
  return ev ? { rootHash: ev.rootHash, storageUrl: ev.storageUrl } : null;
}

function pickReportAnchored(events: DiagnosticEvent[]): ReportAnchor | null {
  const ev = events.find((e) => e.type === "report.anchored") as
    | Extract<DiagnosticEvent, { type: "report.anchored" }>
    | undefined;
  return ev ? { txHash: ev.txHash, chainId: ev.chainId } : null;
}

function pickVerdict(events: DiagnosticEvent[]): VerdictMeta | null {
  const ev = events.find((e) => e.type === "verdict.final") as
    | Extract<DiagnosticEvent, { type: "verdict.final" }>
    | undefined;
  if (!ev) return null;
  return {
    markdown: ev.markdown,
    model: ev.labels?.model,
    provider: ev.labels?.provider,
    stub: ev.labels?.label === "EMULATED",
  };
}

export function Diagnose() {
  const { tokenId } = useParams<{ tokenId: string }>();
  const { events, status, error } = useDiagnosticStream(tokenId ?? null);

  const toolEvents = events.filter(
    (e): e is ToolEvent => e.type === "tool.call" || e.type === "tool.result",
  );
  const narratives = events.filter(
    (e): e is Extract<DiagnosticEvent, { type: "narrative" }> =>
      e.type === "narrative",
  );

  const resolved = pickToolResult<ResolvedPositionOutput>(events, "getV3Position");
  const ilBreakdown = pickToolResult<ILBreakdown>(events, "computeIL");
  const regime = pickToolResult<RegimeClassification>(events, "classifyRegime");
  const hooks = pickToolResult<HookDiscoveryResult>(events, "discoverV4Hooks");
  const migration = pickToolResult<MigrationPreview>(
    events,
    "buildMigrationPreview",
  );
  const provenance = pickReportUploaded(events);
  const anchor = pickReportAnchored(events);
  const verdict = pickVerdict(events);
  const ensPublication = pickToolResult<EnsPublication>(events, "publishEnsRecords");
  const scoring = pickToolResult<HookScoringResult>(events, "scoreHook");

  const provenanceFullyVerified =
    provenance !== null &&
    !provenance.rootHash.startsWith("0xstub") &&
    !provenance.storageUrl.startsWith("stub://") &&
    anchor !== null &&
    !anchor.txHash.startsWith("0xstub");

  const token1Symbol = resolved?.pair?.split("/")?.[1] ?? "T1";

  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="p-8">
      <header className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Diagnose</h1>
            <p className="mt-2 text-slate-400 font-mono text-sm">
              tokenId {tokenId ?? "(missing)"} — stream {status}
              {resolved && (
                <span className="ml-3 text-slate-300">{resolved.pair}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-wrap justify-end">
            {resolved && <LabelBadge label="VERIFIED" />}
            {ilBreakdown && <LabelBadge label="COMPUTED" />}
            {regime && <LabelBadge label="ESTIMATED" />}
            {hooks && <LabelBadge label="LABELED" />}
            {migration && <LabelBadge label="EMULATED" />}
            {provenance && (
              <LabelBadge label={provenanceFullyVerified ? "VERIFIED" : "EMULATED"} />
            )}
            {verdict && (
              <LabelBadge label={verdict.stub ? "EMULATED" : "ESTIMATED"} />
            )}
            {ensPublication && (
              <LabelBadge label={ensPublication.stub ? "EMULATED" : "VERIFIED"} />
            )}
          </div>
        </div>
        {error && <p className="mt-1 text-rose-400 text-sm">{error}</p>}
      </header>

      <main className="max-w-6xl mx-auto mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          {ilBreakdown && (
            <ILPanel breakdown={ilBreakdown} token1Symbol={token1Symbol} />
          )}
          {regime && <RegimePanel classification={regime} />}
          {hooks && <HooksPanel result={hooks} />}
          {scoring && <HookScoringPanel result={scoring} />}
          {migration && (
            <MigrationPanel preview={migration} lpTokenId={tokenId} />
          )}
          {provenance && (
            <ReportProvenancePanel provenance={provenance} anchor={anchor} />
          )}
          {verdict && <VerdictPanel verdict={verdict} />}
          {ensPublication && <EnsPanel publication={ensPublication} />}
        </section>

        <aside className="space-y-6">
          <section className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
            <h2 className="text-xs uppercase tracking-wider text-slate-500">
              Tool calls
            </h2>
            <div className="mt-3 space-y-2">
              {toolEvents.map((ev, i) => (
                <ToolCallBadge key={i} event={ev} />
              ))}
              {toolEvents.length === 0 && (
                <p className="text-slate-500 text-xs">no tool calls yet</p>
              )}
            </div>
          </section>

          <section className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
            <h2 className="text-xs uppercase tracking-wider text-slate-500">
              Narrative
            </h2>
            <div className="mt-3 space-y-2 text-sm leading-relaxed min-h-[3rem]">
              {narratives.length === 0 ? (
                <span className="text-slate-500 text-xs">
                  waiting for narrative…
                </span>
              ) : (
                narratives.map((n, i) =>
                  i === narratives.length - 1 ? (
                    <p key={i} className="text-slate-200">
                      <TypewriterText text={n.text} />
                    </p>
                  ) : (
                    <p key={i} className="text-slate-400">
                      {n.text}
                    </p>
                  ),
                )
              )}
            </div>
          </section>
        </aside>
      </main>
      </div>
    </div>
  );
}
