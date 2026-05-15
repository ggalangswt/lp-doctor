import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { LabelBadge } from "../components/LabelBadge.js";
import {
  useReport,
  type AssembledReportPayload,
  type PublicReport,
} from "../hooks/useReport.js";

function shortHash(hash: string, head = 10, tail = 6): string {
  if (hash.length <= head + tail + 1) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

function formatNumber(n: number, digits = 4): string {
  if (!Number.isFinite(n)) return "n/a";
  return n.toFixed(digits);
}

function chainExplorerUrl(chainId: number, txHash: string): string | null {
  if (chainId === 16602) return `https://chainscan-newton.0g.ai/tx/${txHash}`;
  if (chainId === 16661) return `https://chainscan.0g.ai/tx/${txHash}`;
  return null;
}

interface RowProps {
  k: string;
  v: ReactNode;
}

function Row({ k, v }: RowProps) {
  return (
    <div className="flex items-start gap-3 py-1 text-xs font-mono">
      <span className="text-slate-500 w-32 shrink-0">{k}</span>
      <span className="text-slate-200 min-w-0 flex-1 break-all">{v}</span>
    </div>
  );
}

interface SectionProps {
  title: string;
  label: "VERIFIED" | "COMPUTED" | "ESTIMATED" | "EMULATED" | "LABELED";
  children: ReactNode;
}

function Section({ title, label, children }: SectionProps) {
  return (
    <section className="p-5 rounded-lg border border-slate-700 bg-slate-900/50">
      <header className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <h2 className="text-xs uppercase tracking-wider text-slate-500">
          {title}
        </h2>
        <LabelBadge label={label} />
      </header>
      <div className="mt-3">{children}</div>
    </section>
  );
}

interface ProvenanceProps {
  report: PublicReport;
}

function ProvenanceSection({ report }: ProvenanceProps) {
  const fullyVerified =
    !report.storageStub && report.anchorTxHash !== undefined && report.anchorStub === false;
  const anchorLink =
    report.anchorTxHash && report.anchorChainId
      ? chainExplorerUrl(report.anchorChainId, report.anchorTxHash)
      : null;

  return (
    <Section
      title="provenance"
      label={fullyVerified ? "VERIFIED" : "EMULATED"}
    >
      <Row k="rootHash" v={shortHash(report.rootHash)} />
      <Row
        k="storage"
        v={
          report.storageUrl.startsWith("http") ? (
            <a
              href={report.storageUrl}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-300 hover:text-cyan-200"
            >
              {report.storageUrl}
            </a>
          ) : (
            report.storageUrl
          )
        }
      />
      {report.anchorTxHash && report.anchorChainId !== undefined && (
        <Row
          k="anchor tx"
          v={
            anchorLink && report.anchorStub === false ? (
              <a
                href={anchorLink}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-300 hover:text-emerald-200"
                title={report.anchorTxHash}
              >
                {shortHash(report.anchorTxHash)}
              </a>
            ) : (
              shortHash(report.anchorTxHash)
            )
          }
        />
      )}
      {report.anchorChainId !== undefined && (
        <Row k="chain id" v={String(report.anchorChainId)} />
      )}
      <Row k="cached at" v={report.cachedAt} />
    </Section>
  );
}

interface PayloadSectionsProps {
  payload: AssembledReportPayload;
  token1Symbol: string;
}

function PayloadSections({ payload, token1Symbol }: PayloadSectionsProps) {
  return (
    <>
      <Section title="position" label="VERIFIED">
        <Row k="tokenId" v={payload.position.tokenId} />
        <Row k="version" v={`v${payload.position.version}`} />
        <Row k="pair" v={payload.position.pair} />
        <Row k="owner" v={shortHash(payload.position.owner, 8, 6)} />
        <Row k="agent" v={`${payload.agent.name}@${payload.agent.version}`} />
        <Row k="generated at" v={payload.generatedAt} />
      </Section>

      {payload.il && (
        <Section title="impermanent loss" label="COMPUTED">
          <Row k="hodl value" v={`${formatNumber(payload.il.hodlValueT1)} ${token1Symbol}`} />
          <Row k="lp value" v={`${formatNumber(payload.il.lpValueT1)} ${token1Symbol}`} />
          <Row k="fees value" v={`${formatNumber(payload.il.feesValueT1)} ${token1Symbol}`} />
          <Row k="il (t1)" v={`${formatNumber(payload.il.ilT1)} ${token1Symbol}`} />
          <Row k="il %" v={`${formatNumber(payload.il.ilPct * 100, 2)}%`} />
        </Section>
      )}

      {payload.regime && (
        <Section title="regime" label="ESTIMATED">
          <Row k="top label" v={payload.regime.topLabel} />
          <Row k="confidence" v={`${formatNumber(payload.regime.confidence * 100, 1)}%`} />
          <Row k="narrative" v={payload.regime.narrative} />
        </Section>
      )}

      {payload.hooks && (
        <Section title="v4 hooks" label="LABELED">
          <Row k="pair" v={payload.hooks.pair} />
          <Row k="top family" v={payload.hooks.topFamily.toLowerCase().replace(/_/g, "-")} />
          <Row k="candidate count" v={String(payload.hooks.candidateCount)} />
        </Section>
      )}

      {payload.migration && (
        <Section title="migration plan" label="EMULATED">
          <Row
            k="target hook"
            v={
              payload.migration.targetHookAddress
                ? shortHash(payload.migration.targetHookAddress)
                : "n/a"
            }
          />
          <Row
            k="family"
            v={
              payload.migration.targetFamily
                ? payload.migration.targetFamily.toLowerCase().replace(/_/g, "-")
                : "n/a"
            }
          />
          <Row
            k="price impact"
            v={
              payload.migration.priceImpactPct !== undefined
                ? `${formatNumber(payload.migration.priceImpactPct, 3)}%`
                : "n/a"
            }
          />
          {payload.migration.warnings.length > 0 && (
            <Row
              k="warnings"
              v={
                <ul className="list-disc pl-4 space-y-0.5 text-orange-300/80">
                  {payload.migration.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              }
            />
          )}
        </Section>
      )}
    </>
  );
}

export function Report() {
  const { rootHash } = useParams<{ rootHash: string }>();
  const { status, report, error } = useReport(rootHash ?? null);

  if (!rootHash) {
    return (
      <div className="min-h-screen p-8">
        <p className="text-rose-400">Missing rootHash in URL.</p>
      </div>
    );
  }

  const token1Symbol = report?.payload.position.pair.split("/")?.[1] ?? "T1";

  return (
    <div className="min-h-screen p-8">
      <header className="max-w-4xl mx-auto">
        <Link
          to="/"
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← back to atlas
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Report</h1>
        <p className="mt-1 text-slate-400 font-mono text-xs break-all">
          rootHash {rootHash}
        </p>
      </header>

      <main className="max-w-4xl mx-auto mt-8 space-y-6">
        {status === "loading" && (
          <p className="text-slate-500 text-sm">loading report…</p>
        )}
        {status === "error" && (
          <p className="text-rose-400 text-sm">{error}</p>
        )}
        {status === "ready" && report && (
          <>
            <ProvenanceSection report={report} />
            <PayloadSections payload={report.payload} token1Symbol={token1Symbol} />
          </>
        )}
      </main>
    </div>
  );
}
