import { useState } from "react";
import { LabelBadge } from "./LabelBadge.js";
import { MigrationModal } from "./MigrationModal.js";

interface MigrationStep {
  kind: "close" | "swap" | "mint";
  description: string;
  detail?: Record<string, string>;
}

interface MigrationSwapQuote {
  routing: string;
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  slippageTolerance: number;
  gasFeeUsd: string;
  routeKinds: string[];
}

export interface MigrationPreview {
  fromVersion: 3;
  targetHook?: { address: string; family: string; poolId: string };
  steps: MigrationStep[];
  swapQuote?: MigrationSwapQuote;
  warnings: string[];
}

const KIND_CLS: Record<MigrationStep["kind"], string> = {
  close: "text-rose-300 border-rose-500/40",
  swap: "text-amber-300 border-amber-500/40",
  mint: "text-emerald-300 border-emerald-500/40",
};

const KIND_DOT: Record<MigrationStep["kind"], string> = {
  close: "✕",
  swap: "↔",
  mint: "✦",
};

function shortAddr(addr: string): string {
  return addr.length > 10 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

interface Props {
  preview: MigrationPreview;
  /** Uniswap LP NFT id this preview was diagnosed against. Forwarded
   *  to the modal so the signed Permit2 digest can be recorded on the
   *  LPDoctorAgent iNFT. */
  lpTokenId?: string;
}

export function MigrationPanel({ preview, lpTokenId }: Props) {
  const { steps, targetHook, swapQuote, warnings } = preview;
  const [open, setOpen] = useState(false);
  const canMigrate = preview.steps.length > 0;

  return (
    <section className="p-4 rounded-lg border border-slate-700 bg-slate-900/50">
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-xs uppercase tracking-wider text-slate-500">
          Migration preview
        </h2>
        <LabelBadge label="EMULATED" />
      </header>

      {targetHook ? (
        <p className="mt-3 text-sm text-slate-400">
          Target hook{" "}
          <span className="text-violet-300 font-mono">
            {shortAddr(targetHook.address)}
          </span>{" "}
          —{" "}
          <span className="text-slate-300">
            {targetHook.family.toLowerCase().replace(/_/g, "-")}
          </span>
        </p>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          No V4 target hook discovered for this pair.
        </p>
      )}

      <ol className="mt-3 space-y-2">
        {steps.map((step, i) => (
          <li
            key={i}
            className={`flex items-start gap-3 text-xs font-mono pl-2 border-l ${KIND_CLS[step.kind]}`}
          >
            <span className="mt-0.5 w-4 inline-block text-center">
              {KIND_DOT[step.kind]}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-slate-200">{step.description}</div>
              {step.detail && (
                <div className="mt-1 text-[10px] text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5">
                  {Object.entries(step.detail).map(([k, v]) => (
                    <span key={k}>
                      <span className="text-slate-600">{k}=</span>
                      {v}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>

      {swapQuote && (
        <div className="mt-3 grid grid-cols-3 gap-3 text-[11px] font-mono pt-3 border-t border-slate-800">
          <div>
            <div className="text-slate-500">routing</div>
            <div className="text-slate-200">{swapQuote.routing}</div>
          </div>
          <div>
            <div className="text-slate-500">price impact</div>
            <div className="text-slate-200">
              {(swapQuote.priceImpact * 100).toFixed(3)}%
            </div>
          </div>
          <div>
            <div className="text-slate-500">gas fee</div>
            <div className="text-slate-200">${swapQuote.gasFeeUsd}</div>
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <ul className="mt-3 text-[10px] text-orange-300/80 space-y-0.5 list-disc pl-4">
          {warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-[10px] text-slate-500 flex-1">
          Quote fetched live from the Uniswap Trading API for a small sample
          notional. The agent never executes the swap — the user signs at
          migration time with their own slippage budget.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={!canMigrate}
          className="text-[11px] text-cyan-300 hover:text-cyan-200 px-3 py-1.5 rounded border border-cyan-500/40 hover:border-cyan-400/60 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Migrate →
        </button>
      </div>

      {open && (
        <MigrationModal
          preview={{
            fromVersion: preview.fromVersion,
            targetHook: preview.targetHook
              ? { address: preview.targetHook.address, family: preview.targetHook.family }
              : undefined,
            steps: preview.steps,
            warnings: preview.warnings,
          }}
          lpTokenId={lpTokenId}
          onClose={() => setOpen(false)}
        />
      )}
    </section>
  );
}
