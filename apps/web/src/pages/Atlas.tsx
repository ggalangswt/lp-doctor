import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAccount } from "wagmi";
import { AppHeader } from "../components/AppHeader.js";
import { AggStat } from "../components/AggStat.js";
import { PositionCard } from "../components/PositionCard.js";
import { Cap, Dot, Mono, fmt } from "../design/atoms.js";
import { Addr } from "../design/Addr.js";
import { fetchPositions, type V3PositionRaw } from "../lib/api.js";
import { classifyHealth } from "../lib/health.js";

// Curated demo wallets — one per health-state slot. Each address was
// validated by querying the V3 subgraph + checking the dominant
// position's range/fee state (see HUMAN.md `Curate the demo wallets`).
// Editorial labels match what the page actually renders.
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

// Multi-position demos first — they showcase the dashboard's density
// before the user scrolls. Single-position narrative slots come after.
const CURATED_DEMO_WALLETS: DemoWallet[] = [
  {
    slot: "portfolio",
    label: "portfolio · 30+ positions",
    address: "0xfd235968e65b0990584585763f837a5b5330e6de",
    hint: "30 LP positions across 27 different pools · diverse pro LP wallet",
  },
  {
    slot: "bleeding",
    label: "bleeding · 10 out-of-range",
    address: "0x8f4daa33706d70677fd69e4e0d47e595bc820e95",
    hint: "10 USDC/WETH positions · ALL out-of-range · ~$600 k stuck · 0 fees",
  },
  {
    slot: "mixed",
    label: "mixed · 5 trapped above",
    address: "0x4d3e3d1a38505185ba86a1b1f3084195d556bc2a",
    hint: "5 USDC/WETH positions · all out (price climbed) · strong fee history",
  },
  {
    slot: "whale",
    label: "whale · $20 m healthy",
    address: "0x4b296808f414ab3775889fa2863e1d73f958a58e",
    hint: "$20.9 m USDC + 5 893 WETH · in-range 23 % · mature LP, fees > deposits",
  },
  {
    slot: "healthy",
    label: "healthy · in-range",
    address: "0x90deceec188094f6f6c1ef446d843f70abfc92cb",
    hint: "single position · USDC/WETH 0.05% · in-range at 46 % · 111 % fee ratio",
  },
  {
    slot: "drifting",
    label: "drifting · close-to-edge",
    address: "0x7c6ef14f6890d0fda17fb8e4fb6f649f0355c3be",
    hint: "USDC/WETH 0.05% · still in-range but at 14 % · USDC-heavy ($500 k)",
  },
];

const SLOT_TONE: Record<DemoWallet["slot"], string> = {
  portfolio: "var(--violet, #b48cff)",
  bleeding: "var(--bleed)",
  mixed: "var(--toxic)",
  whale: "var(--cyan)",
  healthy: "var(--healthy)",
  drifting: "var(--toxic)",
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
    totalFees +=
      parseFloat(p.collectedFeesToken0) + parseFloat(p.collectedFeesToken1);
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
  const [activeSlot, setActiveSlot] = useState<DemoWallet["slot"] | null>(
    null,
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ["positions", submitted],
    queryFn: () => fetchPositions(submitted!),
    enabled: !!submitted,
  });

  const positions = data?.positions ?? [];
  const stats = aggregate(positions);

  return (
    <div style={{ minHeight: "100vh" }}>
      <AppHeader />

      <main
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "48px 36px 120px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 40,
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <Dot color="cyan" pulse />
              <Cap style={{ color: "var(--cyan)" }}>
                ATLAS · {positions.length} POSITION
                {positions.length === 1 ? "" : "S"} TRACKED
              </Cap>
            </div>
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: "clamp(32px, 4vw, 44px)",
                fontWeight: 500,
                letterSpacing: "-0.03em",
              }}
            >
              Your liquidity, under the lens.
            </h1>
            {submitted && (
              <div
                style={{
                  marginTop: 12,
                  color: "var(--text-secondary)",
                  fontSize: 14,
                  display: "flex",
                  gap: 18,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <span>
                  Wallet <Addr value={submitted} />
                </span>
                {activeSlot && (
                  <>
                    <span style={{ color: "var(--text-faint)" }}>·</span>
                    <span style={{ color: SLOT_TONE[activeSlot] }}>
                      curated demo wallet — slot{" "}
                      <Mono>{activeSlot}</Mono>
                    </span>
                  </>
                )}
                {!isLoading && data && (
                  <>
                    <span style={{ color: "var(--text-faint)" }}>·</span>
                    <span>
                      <Mono>{positions.length}</Mono> position
                      {positions.length === 1 ? "" : "s"} from subgraph
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setActiveSlot(null);
            setSubmitted(address.trim());
          }}
          style={{ display: "flex", gap: 8, marginBottom: 16 }}
        >
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x... wallet address"
            style={{
              flex: 1,
              padding: "10px 14px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: "var(--text)",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--cyan)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />
          <button
            type="submit"
            disabled={!address.trim()}
            className="btn btn-primary"
            style={{ padding: "10px 18px", fontSize: 13 }}
          >
            Load
          </button>
        </form>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 32,
          }}
        >
          <Cap
            style={{
              color: "var(--text-tertiary)",
              alignSelf: "center",
              marginRight: 8,
            }}
          >
            DEMO WALLETS →
          </Cap>
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
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                padding: "8px 14px",
                background: "transparent",
                color:
                  activeSlot === w.slot ? SLOT_TONE[w.slot] : "var(--text-secondary)",
                border: `1px solid ${
                  activeSlot === w.slot ? SLOT_TONE[w.slot] : "var(--border)"
                }`,
                borderRadius: 6,
                cursor: "pointer",
                transition: "color 160ms, border-color 160ms",
              }}
            >
              {w.label}
            </button>
          ))}
        </div>

        {!submitted ? (
          <p
            style={{
              marginTop: 8,
              color: "var(--text-tertiary)",
              fontSize: 13,
            }}
          >
            Paste a wallet address above, or pick a demo wallet to start.
          </p>
        ) : isLoading ? (
          <p
            style={{
              marginTop: 8,
              color: "var(--text-tertiary)",
              fontSize: 13,
              fontFamily: "var(--font-mono)",
            }}
          >
            loading…
          </p>
        ) : error ? (
          <p
            style={{
              marginTop: 8,
              color: "var(--bleed)",
              fontSize: 13,
              fontFamily: "var(--font-mono)",
            }}
          >
            error: {(error as Error).message}
          </p>
        ) : positions.length === 0 ? (
          <p
            style={{
              marginTop: 8,
              color: "var(--text-tertiary)",
              fontSize: 13,
              fontFamily: "var(--font-mono)",
            }}
          >
            no positions found for {submitted}
          </p>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 0,
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                marginBottom: 32,
              }}
            >
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

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                gap: 20,
              }}
            >
              {positions.map((p) => (
                <PositionCard key={p.id} position={p} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
