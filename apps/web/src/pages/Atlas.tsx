import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAccount } from "wagmi";
import { AppHeader } from "../components/AppHeader.js";
import { AggStat } from "../components/AggStat.js";
import { PositionCard } from "../components/PositionCard.js";
import { Cap, Mono, fmt } from "../design/atoms.js";
import { Addr } from "../design/Addr.js";
import { fetchPositions, type V3PositionRaw } from "../lib/api.js";
import { classifyHealth } from "../lib/health.js";
import "../styles/atlas.css";

interface DemoWallet {
  slot:
    | "portfolio"
    | "bleeding"
    | "mixed"
    | "whale"
    | "healthy"
    | "drifting";
  label: string;
  address: string;
  hint: string;
}

const CURATED_DEMO_WALLETS: DemoWallet[] = [
  {
    slot: "portfolio",
    label: "portfolio · 30+ positions",
    address: "0xfd235968e65b0990584585763f837a5b5330e6de",
    hint: "30 LP positions across 27 pools. Diverse pro LP wallet.",
  },
  {
    slot: "bleeding",
    label: "bleeding · 10 out-of-range",
    address: "0x8f4daa33706d70677fd69e4e0d47e595bc820e95",
    hint: "10 USDC/WETH positions. All out-of-range. Around $600k stuck.",
  },
  {
    slot: "mixed",
    label: "mixed · 5 trapped above",
    address: "0x4d3e3d1a38505185ba86a1b1f3084195d556bc2a",
    hint: "5 USDC/WETH positions. Price climbed past the range.",
  },
  {
    slot: "whale",
    label: "whale · $20m healthy",
    address: "0x4b296808f414ab3775889fa2863e1d73f958a58e",
    hint: "$20.9m USDC plus 5,893 WETH. Mature LP, fees above deposits.",
  },
  {
    slot: "healthy",
    label: "healthy · in-range",
    address: "0x90deceec188094f6f6c1ef446d843f70abfc92cb",
    hint: "Single USDC/WETH 0.05% position. In-range at 46%.",
  },
  {
    slot: "drifting",
    label: "drifting · close-to-edge",
    address: "0x7c6ef14f6890d0fda17fb8e4fb6f649f0355c3be",
    hint: "USDC/WETH 0.05%. Still in-range, but near the edge.",
  },
];

const SLOT_TONE: Record<DemoWallet["slot"], string> = {
  portfolio: "var(--lp-purple)",
  bleeding: "var(--lp-bleed)",
  mixed: "var(--lp-toxic)",
  whale: "var(--lp-cobalt)",
  healthy: "var(--lp-healthy)",
  drifting: "var(--lp-toxic)",
};

function aggregate(positions: V3PositionRaw[]) {
  let totalDeposited = 0;
  let totalFees = 0;
  let bleeding = 0;
  let drift = 0;
  let healthy = 0;

  for (const p of positions) {
    totalDeposited +=
      parseFloat(p.depositedToken0) + parseFloat(p.depositedToken1);
    totalFees += parseFloat(p.collectedFeesToken0) + parseFloat(p.collectedFeesToken1);
    const h = classifyHealth(p);
    if (h === "red") bleeding += 1;
    else if (h === "amber") drift += 1;
    else healthy += 1;
  }

  return { totalDeposited, totalFees, bleeding, drift, healthy };
}

export function Atlas() {
  const { address: connectedAddress } = useAccount();
  const [address, setAddress] = useState(connectedAddress ?? "");
  const [submitted, setSubmitted] = useState<string | null>(
    connectedAddress ?? null,
  );
  const [activeSlot, setActiveSlot] = useState<DemoWallet["slot"] | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["positions", submitted],
    queryFn: () => fetchPositions(submitted!),
    enabled: !!submitted,
  });

  const positions = data?.positions ?? [];
  const stats = aggregate(positions);
  const hasResults = submitted && !isLoading && !error && positions.length > 0;

  return (
    <div className="atlas-theme">
      <div className="atlas-grid-bg" aria-hidden />
      <AppHeader />

      <main className="atlas-shell">
        <section className="atlas-hero">
          <div className="atlas-title-stack">
            <div className="atlas-kicker">
              <span className="atlas-pixel-dot" aria-hidden />
              <Cap>ATLAS · {positions.length} POSITION{positions.length === 1 ? "" : "S"} TRACKED</Cap>
            </div>
            <h1 className="atlas-title">Wallet scanner for LP bleed.</h1>
            <p className="atlas-subtitle">
              Paste a wallet, pick a demo cartridge, then scan every Uniswap V3
              position by health state, range, fees, liquidity, and next action.
            </p>
            {submitted && (
              <div className="atlas-context-line">
                <span>
                  Wallet <Addr value={submitted} />
                </span>
                {activeSlot && (
                  <span style={{ color: SLOT_TONE[activeSlot] }}>
                    demo slot <Mono>{activeSlot}</Mono>
                  </span>
                )}
                {!isLoading && data && (
                  <span>
                    <Mono>{positions.length}</Mono> position
                    {positions.length === 1 ? "" : "s"} from subgraph
                  </span>
                )}
              </div>
            )}
          </div>

          <form
            className="lp-window atlas-scan-window"
            onSubmit={(e) => {
              e.preventDefault();
              const next = address.trim();
              if (!next) return;
              setActiveSlot(null);
              setSubmitted(next);
            }}
          >
            <div className="lp-window-bar">
              <div className="lp-window-dots" aria-hidden>
                <span className="lp-window-dot" style={{ background: "var(--lp-bleed)" }} />
                <span className="lp-window-dot" style={{ background: "var(--lp-toxic)" }} />
                <span className="lp-window-dot" style={{ background: "var(--lp-healthy)" }} />
              </div>
              <span className="lp-window-title">WALLET SCAN COMMAND</span>
            </div>
            <div className="lp-window-body">
              <label className="atlas-scan-row">
                <span className="atlas-scan-prompt">scan:</span>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="0x... wallet address"
                  className="atlas-scan-input"
                  spellCheck={false}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!address.trim()}
                  className="atlas-scan-btn"
                >
                  Load
                  <PixelArrow />
                </button>
              </label>
            </div>
          </form>
        </section>

        <section className="atlas-demo-section" aria-labelledby="atlas-demo-wallets">
          <div className="atlas-section-head">
            <div>
              <div id="atlas-demo-wallets" className="cap">
                DEMO WALLETS
              </div>
              <h2>Pick a health state cartridge.</h2>
            </div>
            <span className="mono atlas-section-note">
              curated fixtures for portfolio, bleed, drift, whale, and healthy flows
            </span>
          </div>

          <div className="atlas-cartridge-grid">
            {CURATED_DEMO_WALLETS.map((w) => (
              <button
                key={w.slot}
                type="button"
                title={w.hint}
                onClick={() => {
                  setActiveSlot(w.slot);
                  setAddress(w.address);
                  setSubmitted(w.address);
                }}
                className={`atlas-cartridge${
                  activeSlot === w.slot ? " atlas-cartridge--active" : ""
                }`}
                style={
                  activeSlot === w.slot
                    ? {
                        borderColor: SLOT_TONE[w.slot],
                        background: `color-mix(in oklch, ${SLOT_TONE[w.slot]} 9%, oklch(0.985 0.012 300))`,
                      }
                    : undefined
                }
              >
                <span className="atlas-cartridge-top">
                  <span
                    className="atlas-cartridge-dot"
                    style={{ background: SLOT_TONE[w.slot] }}
                    aria-hidden
                  />
                  <span className="atlas-cartridge-label">{w.label}</span>
                </span>
                <span className="atlas-cartridge-hint">{w.hint}</span>
              </button>
            ))}
          </div>
        </section>

        {!submitted ? (
          <AtlasStatePanel
            tone="idle"
            title="Awaiting wallet command"
            body="Paste a wallet address above or pick a demo cartridge to start scanning LP positions."
          />
        ) : isLoading ? (
          <AtlasLoadingPanel submitted={submitted} />
        ) : error ? (
          <AtlasStatePanel
            tone="error"
            title="Scanner failed"
            body={`Position lookup failed: ${(error as Error).message}`}
          />
        ) : positions.length === 0 ? (
          <AtlasStatePanel
            tone="empty"
            title="No LP positions found"
            body={`No Uniswap positions were found for ${submitted}. Try a demo cartridge to inspect the Atlas flow.`}
          />
        ) : (
          <>
            <section className="lp-window atlas-score-window" aria-label="Wallet aggregate stats">
              <div className="lp-window-bar">
                <div className="lp-window-dots" aria-hidden>
                  <span className="lp-window-dot" style={{ background: "var(--lp-bleed)" }} />
                  <span className="lp-window-dot" style={{ background: "var(--lp-toxic)" }} />
                  <span className="lp-window-dot" style={{ background: "var(--lp-healthy)" }} />
                </div>
                <span className="lp-window-title">WALLET HEALTH SCOREBOARD</span>
              </div>
              <div className="atlas-score-strip">
                <AggStat
                  label="DEPOSITED"
                  value={fmt.num(stats.totalDeposited)}
                  sub="token0 + token1"
                />
                <AggStat
                  label="FEES CAPTURED"
                  value={fmt.num(stats.totalFees)}
                  sub="lifetime"
                  tone={stats.totalFees > 0 ? "pos" : undefined}
                />
                <AggStat
                  label="HEALTHY"
                  value={String(stats.healthy)}
                  sub="in-range positions"
                  tone="pos"
                />
                <AggStat
                  label="DRIFTING"
                  value={String(stats.drift)}
                  sub="needs review"
                  tone="toxic"
                />
                <AggStat
                  label="BLEEDING"
                  value={String(stats.bleeding)}
                  sub="recommend migrate"
                  tone="bleed"
                  isLast
                />
              </div>
            </section>

            <section className="atlas-results-head">
              <div>
                <Cap>POSITION CARDS</Cap>
                <h2>{positions.length} LP position{positions.length === 1 ? "" : "s"} in scope.</h2>
              </div>
              <span className="mono atlas-section-note">
                open any card to stream Diagnose for that tokenId
              </span>
            </section>

            <section
              className="atlas-position-grid"
              aria-label="Liquidity positions"
              data-has-results={hasResults ? "true" : "false"}
            >
              {positions.map((p) => (
                <PositionCard key={p.id} position={p} />
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function AtlasStatePanel({
  tone,
  title,
  body,
}: {
  tone: "idle" | "empty" | "error";
  title: string;
  body: string;
}) {
  return (
    <section className={`lp-window atlas-state-panel atlas-state-panel--${tone}`}>
      <div className="lp-window-bar">
        <div className="lp-window-dots" aria-hidden>
          <span className="lp-window-dot" style={{ background: "var(--lp-bleed)" }} />
          <span className="lp-window-dot" style={{ background: "var(--lp-toxic)" }} />
          <span className="lp-window-dot" style={{ background: "var(--lp-healthy)" }} />
        </div>
        <span className="lp-window-title">ATLAS OUTPUT</span>
      </div>
      <div className="lp-window-body">
        <p className="atlas-terminal-line">
          <span className="atlas-terminal-prompt">&gt;</span> {title}
        </p>
        <p className={tone === "error" ? "atlas-terminal-line atlas-terminal-line--bleed" : "atlas-terminal-line atlas-terminal-line--faint"}>
          {body}
        </p>
      </div>
    </section>
  );
}

function AtlasLoadingPanel({ submitted }: { submitted: string }) {
  return (
    <section className="lp-window atlas-state-panel">
      <div className="lp-window-bar">
        <div className="lp-window-dots" aria-hidden>
          <span className="lp-window-dot" style={{ background: "var(--lp-bleed)" }} />
          <span className="lp-window-dot" style={{ background: "var(--lp-toxic)" }} />
          <span className="lp-window-dot" style={{ background: "var(--lp-healthy)" }} />
        </div>
        <span className="lp-window-title">QUERYING SUBGRAPH</span>
      </div>
      <div className="lp-window-body">
        <p className="atlas-terminal-line">
          <span className="atlas-terminal-prompt">&gt;</span> loading wallet{" "}
          <Addr value={submitted} />
        </p>
        <div className="atlas-skeleton-grid" aria-hidden>
          <span />
          <span />
          <span />
        </div>
      </div>
    </section>
  );
}

function PixelArrow() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2 6h8M6.5 2.5 10 6 6.5 9.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
