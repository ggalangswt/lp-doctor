import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { HeroFilm } from "../components/HeroFilm.js";
import { Logo } from "../components/Logo.js";

// 14-slide deck mirror of LPDoctor-Open-Agents-2026.pdf. Each slide is a
// fixed 1280×720 surface scaled to the viewport, snap-scrolled. Cover
// (slide 1) is a chrome-less hero replica; slides 2–14 share the same
// header/footer chrome as the PDF master.

const TOTAL_SLIDES = 14;

const COLOR_AMBER = "#FFB020";
const COLOR_VIOLET = "#C59CFF";
const COLOR_GREEN = "#8EE887";
const COLOR_RED = "#FF5E4F";
const COLOR_GOLD = "#F5D266";
const COLOR_CYAN = "#7DD3FC";

interface SlideShellProps {
  index: number; // 1-based
  marker: string; // e.g. "01 · THE PAIN"
  caption?: string;
  children: ReactNode;
  bare?: boolean; // slide 1 — no chrome
}

function SlideShell({ index, marker, caption, children, bare }: SlideShellProps) {
  return (
    <section
      style={{
        scrollSnapAlign: "start",
        height: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: "var(--base)",
        padding: "min(2vh, 24px)",
      }}
    >
      <div
        style={{
          width: "min(96vw, calc((100vh - 48px) * 16 / 9))",
          aspectRatio: "16 / 9",
          background: "var(--base)",
          border: "1px solid var(--border-faint)",
          borderRadius: 12,
          overflow: "hidden",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          boxShadow:
            "0 0 0 1px rgba(255,176,32,0.04), 0 40px 80px -40px rgba(0,0,0,0.7)",
        }}
      >
        {!bare && (
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "22px 36px 0 36px",
              fontSize: 13,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <Logo size={16} />
              </span>
              <strong
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                }}
              >
                LP Doctor
              </strong>
              <span style={{ color: "var(--text-tertiary)" }}>|</span>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 300,
                  letterSpacing: "0.18em",
                  color: "var(--text-secondary)",
                  fontSize: 14,
                }}
              >
                &lt;HACKATHON_OR_SUBMISSION_CONTEXT&gt;
              </span>
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                background: "rgba(20,22,32,0.7)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                letterSpacing: "0.18em",
                color: "var(--text-secondary)",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: COLOR_AMBER,
                  boxShadow: `0 0 8px ${COLOR_AMBER}`,
                }}
              />
              {marker}
            </div>
          </header>
        )}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {children}
        </div>

        {!bare && (
          <footer
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 36px 16px 36px",
              fontSize: 12,
              color: "var(--text-tertiary)",
            }}
          >
            <span style={{ maxWidth: "75%" }}>{caption}</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>
              {String(index).padStart(2, "0")} / {TOTAL_SLIDES}
            </span>
          </footer>
        )}
      </div>
    </section>
  );
}

function Eyebrow({ color = COLOR_AMBER, children }: { color?: string; children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        letterSpacing: "0.22em",
        color,
        marginBottom: 18,
      }}
    >
      {children}
    </div>
  );
}

function Title({ children, size = 56 }: { children: ReactNode; size?: number }) {
  return (
    <h1
      style={{
        margin: 0,
        fontFamily: "var(--font-display)",
        fontSize: size,
        lineHeight: 1.05,
        fontWeight: 700,
        letterSpacing: "-0.025em",
        color: "var(--text)",
      }}
    >
      {children}
    </h1>
  );
}

function Subtitle({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        margin: "16px 0 0 0",
        fontSize: 18,
        lineHeight: 1.45,
        color: "var(--text-secondary)",
        maxWidth: 980,
      }}
    >
      {children}
    </p>
  );
}

// ─── 01 · COVER ────────────────────────────────────────────────────
function Slide01Cover() {
  return (
    <SlideShell index={1} marker="00 · COVER" bare>
      <div
        style={{
          flex: 1,
          backgroundImage: "url(/deck/hero.png)",
          backgroundSize: "cover",
          backgroundPosition: "left center",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 28,
            bottom: 28,
            padding: "14px 20px",
            background: "rgba(20,22,32,0.85)",
            border: "1px solid rgba(255,176,32,0.4)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            letterSpacing: "0.16em",
            color: COLOR_AMBER,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: COLOR_AMBER,
              boxShadow: `0 0 8px ${COLOR_AMBER}`,
            }}
          />
          ETHGLOBAL OPEN AGENTS · ROUND 1 SUBMISSION
        </div>
      </div>
    </SlideShell>
  );
}

// ─── 02 · THE PAIN ─────────────────────────────────────────────────
function Slide02Pain() {
  return (
    <SlideShell
      index={2}
      marker="01 · THE PAIN"
      caption="Half of all LP positions lose money. Existing tools show the loss — none explain it."
    >
      <div style={{ padding: "28px 36px 0 36px" }}>
        <Eyebrow>THE PROBLEM</Eyebrow>
        <Title size={64}>
          Liquidity providers are bleeding —
          <br />
          and nobody tells them why.
        </Title>
      </div>
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          padding: "32px 36px",
        }}
      >
        <StatPanel
          accent={COLOR_RED}
          big="49.5%"
          label="of Uniswap V3 LPs are net-negative vs HODL"
          source="Bancor / Topaz Blue research, top-pool sample"
        />
        <StatPanel
          accent={COLOR_AMBER}
          big="−1.6%"
          label="median 30-day net return — ETH/USDC 0.3%"
          source="After fees captured, IL realized, MEV subtracted"
        />
      </div>
    </SlideShell>
  );
}

function StatPanel({
  accent,
  big,
  label,
  source,
}: {
  accent: string;
  big: string;
  label: string;
  source: string;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderLeft: `4px solid ${accent}`,
        borderRadius: 10,
        padding: "32px 32px 24px 32px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 120,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          color: accent,
        }}
      >
        {big}
      </div>
      <div style={{ marginTop: 18, fontSize: 18, fontWeight: 600 }}>{label}</div>
      <div style={{ marginTop: 10, fontSize: 13, color: "var(--text-tertiary)", fontStyle: "italic" }}>
        {source}
      </div>
    </div>
  );
}

// ─── 03 · LANDSCAPE ────────────────────────────────────────────────
function Slide03Landscape() {
  return (
    <SlideShell
      index={3}
      marker="02 · LANDSCAPE"
      caption="An LLM alone can't solve this either — it has no live chain data, no V4 hook awareness."
    >
      <div style={{ padding: "28px 36px 0 36px" }}>
        <Eyebrow>WHY NOBODY SOLVES IT</Eyebrow>
        <Title size={50}>
          Diagnosing a position takes 5 sources, 3 disciplines, and 30 minutes.
        </Title>
        <Subtitle>
          And by the time you've cross-referenced them all, the regime has shifted again.
        </Subtitle>
      </div>
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: 16,
          padding: "28px 36px",
        }}
      >
        <ToolCard accent={COLOR_VIOLET} title="Revert Finance" tag="POSITION EXPLORER" body="Raw numbers. No story. No action." />
        <ToolCard accent={COLOR_CYAN} title="Uniswap Info" tag="POOL DASHBOARD" body="Pool-level data. Not your position." />
        <ToolCard accent={COLOR_GOLD} title="Twitter / threads" tag="CROWD-SOURCED ALPHA" body="Noise, not signal. No live data." />
        <ToolCard accent={COLOR_RED} title="Etherscan" tag="TX EXPLORER" body="Transactions. Not the why." />
      </div>
    </SlideShell>
  );
}

function ToolCard({
  accent,
  title,
  tag,
  body,
}: {
  accent: string;
  title: string;
  tag: string;
  body: string;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderLeft: `4px solid ${accent}`,
        borderRadius: 8,
        padding: "20px 26px",
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 700 }}>{title}</div>
      <div
        style={{
          marginTop: 6,
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.18em",
          color: accent,
        }}
      >
        {tag}
      </div>
      <div style={{ marginTop: 14, color: "var(--text-secondary)", fontStyle: "italic", fontSize: 15 }}>
        {body}
      </div>
    </div>
  );
}

// ─── 04 · THESIS ───────────────────────────────────────────────────
function Slide04Thesis() {
  return (
    <SlideShell
      index={4}
      marker="03 · THESIS"
      caption="One signed verdict per position. Reproducible. Verifiable. Callable by other agents."
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 36px",
          textAlign: "center",
        }}
      >
        {/*
          Reuse the live HeroFilm component from the landing hero so the
          slide and the site share the exact same prism artwork. The
          component positions itself absolutely against its parent, so we
          wrap it in a relative box of fixed deck-friendly dimensions.
        */}
        <div
          style={{
            width: 420,
            height: 260,
            position: "relative",
            border: "1px solid rgba(255,176,32,0.25)",
            borderRadius: 10,
            overflow: "hidden",
            background: "var(--base)",
          }}
        >
          <HeroFilm />
        </div>

        <h1
          style={{
            margin: "32px 0 0 0",
            fontFamily: "var(--font-display)",
            fontSize: 88,
            letterSpacing: "-0.03em",
            fontWeight: 700,
            color: COLOR_AMBER,
          }}
        >
          LP Doctor
        </h1>
        <p
          style={{
            margin: "20px 0 0 0",
            fontSize: 22,
            lineHeight: 1.5,
            maxWidth: 1100,
            color: "var(--text)",
          }}
        >
          Autonomous agent on <span style={{ color: COLOR_CYAN }}>0G</span> that reads your{" "}
          <span style={{ color: COLOR_VIOLET }}>Uniswap V3/V4</span> position, reconstructs why it's
          bleeding, simulates <span style={{ color: COLOR_AMBER }}>every V4 hook</span> against the
          last 1 000 swaps, and migrates you in a single{" "}
          <span style={{ color: COLOR_GREEN }}>Permit2</span> signature.
        </p>
        <p
          style={{
            margin: "24px 0 0 0",
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            letterSpacing: "0.16em",
            color: "var(--text-tertiary)",
          }}
        >
          Diagnostic, not auto-deploy. Signed inside a TEE. Anchored on 0G Chain. Callable by any other agent via MCP.
        </p>
      </div>
    </SlideShell>
  );
}

// ─── 05 · ATLAS ────────────────────────────────────────────────────
function Slide05Atlas() {
  return (
    <SlideShell
      index={5}
      marker="04 · WHAT THE USER SEES"
      caption="Six demo wallets pin the green / amber / red narrative."
    >
      <div style={{ padding: "20px 36px 0 36px" }}>
        <Eyebrow>BEAT 1 · ATLAS</Eyebrow>
        <Title size={44}>All your positions, scanned in one place.</Title>
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 28,
          padding: "16px 36px 24px 36px",
          alignItems: "stretch",
        }}
      >
        <ScreenshotFrame src="/deck/atlas.png" alt="Atlas page (bleeding wallet)" />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 22 }}>
          <HealthState
            color={COLOR_GREEN}
            label="HEALTHY"
            body="In-range, fees flowing, positions classified live by the agent."
          />
          <HealthState
            color={COLOR_AMBER}
            label="DRIFTING"
            body="Close-to-edge — the agent flags before it goes red."
          />
          <HealthState
            color={COLOR_RED}
            label="BLEEDING"
            body="Out-of-range, IL dominant. One click to diagnose & migrate."
          />
        </div>
      </div>
    </SlideShell>
  );
}

function HealthState({ color, label, body }: { color: string; label: string; body: string }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            letterSpacing: "0.22em",
            color,
            fontWeight: 600,
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ marginTop: 10, fontSize: 16, lineHeight: 1.45, color: "var(--text-secondary)" }}>
        {body}
      </div>
    </div>
  );
}

function ScreenshotFrame({ src, alt }: { src: string; alt: string }) {
  // Position the image absolutely inside a relative wrapper so it never
  // pushes the grid row taller than the slide's reserved area. objectFit
  // cover + objectPosition top keeps the page chrome (LPDoctor header) in
  // frame while the bottom of long pages crops cleanly.
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        overflow: "hidden",
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 0,
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          position: "absolute",
          inset: 0,
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "top",
        }}
      />
    </div>
  );
}

// ─── 06 · LIVE DIAGNOSTIC ──────────────────────────────────────────
function Slide06Diagnose() {
  const phases = [
    ["01", "Position resolve", COLOR_GREEN],
    ["03", "IL reconstruct (closed-form)", COLOR_GREEN],
    ["04", "Regime classify", COLOR_AMBER],
    ["05", "Hook discovery", COLOR_AMBER],
    ["06", "Hook replay 1k · 0 bps drift", COLOR_VIOLET],
    ["07", "Migration plan", COLOR_VIOLET],
    ["10", "Verdict (TEE) + AT-4 guard", COLOR_CYAN],
    ["08", "Report + 0G Storage", COLOR_AMBER],
    ["09", "0G Chain anchor", COLOR_AMBER],
  ];
  return (
    <SlideShell
      index={6}
      marker="05 · LIVE DIAGNOSTIC"
      caption="Each phase emits a typed SSE event with one of five honesty labels. If the agent did not replay the swaps, the label says EMULATED. No silent hallucinations."
    >
      <div style={{ padding: "20px 36px 0 36px" }}>
        <Eyebrow>BEAT 2 · THE AGENT WORKS</Eyebrow>
        <Title size={44}>9 phases, streaming live over SSE.</Title>
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          gap: 28,
          padding: "16px 36px 24px 36px",
        }}
      >
        <ScreenshotFrame src="/deck/diagnose.png" alt="Diagnose run page" />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              letterSpacing: "0.2em",
              color: "var(--text-tertiary)",
              marginBottom: 10,
            }}
          >
            PHASES
          </div>
          {phases.map(([n, name, c]) => (
            <div
              key={n}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "8px 0",
                borderTop: "1px solid var(--border-faint)",
                fontSize: 15,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  width: 24,
                  color: "var(--text-tertiary)",
                }}
              >
                {n}
              </span>
              <span style={{ flex: 1 }}>{name}</span>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: c as string,
                  boxShadow: `0 0 6px ${c}`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}

// ─── 07 · PROVENANCE ───────────────────────────────────────────────
function Slide07Provenance() {
  return (
    <SlideShell
      index={7}
      marker="06 · PROVENANCE"
      caption="Anyone can verify a report via on-chain read — no LP Doctor API trust required."
    >
      <div style={{ padding: "20px 36px 0 36px" }}>
        <Eyebrow>BEAT 4 · SIGNED REPORT</Eyebrow>
        <Title size={42}>Every diagnosis is signed in a TEE and anchored on-chain.</Title>
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr",
          gap: 28,
          padding: "16px 36px 24px 36px",
        }}
      >
        <ScreenshotFrame src="/deck/report.png" alt="Report page" />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
          <ProvenanceCard
            color={COLOR_AMBER}
            label="0G COMPUTE"
            title="TDX-attested"
            sub="qwen-2.5-7b · broker-signed"
          />
          <ProvenanceCard
            color={COLOR_CYAN}
            label="0G STORAGE"
            title="Content-addressed"
            sub="merkle rootHash returned"
          />
          <ProvenanceCard
            color={COLOR_GREEN}
            label="0G CHAIN"
            title="Anchored"
            sub="LPDoctorReports.publishReport"
          />
          <ProvenanceCard
            color={COLOR_VIOLET}
            label="AGENT MEMORY"
            title="Persistent cursor"
            sub="memoryRoot updated per diagnose"
          />
        </div>
      </div>
    </SlideShell>
  );
}

function ProvenanceCard({
  color,
  label,
  title,
  sub,
}: {
  color: string;
  label: string;
  title: string;
  sub: string;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderLeft: `4px solid ${color}`,
        borderRadius: 8,
        padding: "14px 20px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.22em",
          color,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div style={{ marginTop: 6, fontSize: 22, fontWeight: 700 }}>{title}</div>
      <div style={{ marginTop: 4, fontSize: 13, color: "var(--text-tertiary)" }}>{sub}</div>
    </div>
  );
}

// ─── 08 · MIGRATION ────────────────────────────────────────────────
function Slide08Migration() {
  return (
    <SlideShell index={8} marker="07 · MIGRATION">
      <div style={{ padding: "32px 36px 0 36px" }}>
        <Eyebrow>BEAT 3 · ONE SIGNATURE</Eyebrow>
        <Title size={52}>V3 → V4, atomic, in one Permit2 signature.</Title>
        <Subtitle>
          The agent never executes — the user keeps custody. We hand over a signed bundle ready to
          broadcast.
        </Subtitle>
      </div>
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 28px 1fr 28px 1fr",
          gap: 0,
          alignItems: "stretch",
          padding: "32px 36px 16px 36px",
        }}
      >
        <MigrationStep n="1" color={COLOR_RED} title="BURN V3" sub1="NonfungiblePosition" sub2="Manager.burn(tokenId)" />
        <MigrationArrow />
        <MigrationStep n="2" color={COLOR_AMBER} title="SWAP" sub1="Universal Router" sub2="Uniswap Trading API quote" />
        <MigrationArrow />
        <MigrationStep n="3" color={COLOR_GREEN} title="MINT V4" sub1="PoolManager.mint" sub2="into winning hook" />
      </div>
      <div
        style={{
          margin: "0 36px 24px 36px",
          padding: "16px 22px",
          border: `1px solid ${COLOR_AMBER}`,
          borderRadius: 8,
          background: "rgba(255,176,32,0.04)",
        }}
      >
        <div style={{ display: "flex", gap: 18, alignItems: "baseline", flexWrap: "wrap" }}>
          <strong style={{ color: COLOR_AMBER, letterSpacing: "0.18em", fontFamily: "var(--font-mono)", fontSize: 13 }}>
            SIGN
          </strong>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text-secondary)" }}>
            PermitSingle EIP-712 · verifyingContract = Permit2 · spender = Universal Router · sigDeadline = 1 hour
          </span>
        </div>
        <div style={{ marginTop: 8, fontStyle: "italic", color: "var(--text-secondary)" }}>
          → all three transactions become broadcastable from a single signed payload.
        </div>
      </div>
    </SlideShell>
  );
}

function MigrationStep({
  n,
  color,
  title,
  sub1,
  sub2,
}: {
  n: string;
  color: string;
  title: string;
  sub1: string;
  sub2: string;
}) {
  return (
    <div
      style={{
        border: `2px solid ${color}`,
        borderRadius: 8,
        padding: "32px 28px",
        background: `${color}11`,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ fontSize: 80, lineHeight: 1, fontWeight: 800, color }}>{n}</div>
      <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "0.06em", marginTop: 12 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "var(--font-mono)", marginTop: 8 }}>
        {sub1}
        <br />
        {sub2}
      </div>
    </div>
  );
}

function MigrationArrow() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: COLOR_AMBER,
        fontSize: 28,
      }}
    >
      →
    </div>
  );
}

// ─── 09 · AUTONOMOUS AGENTS ─────────────────────────────────────────
function Slide09INft() {
  return (
    <SlideShell
      index={9}
      marker="08 · AUTONOMOUS AGENTS"
      caption="Two on-chain txs per diagnose: updateMemoryRoot + recordDiagnose. Permit2 sign → recordMigration. cast call agents(1) returns the live cursor."
    >
      <div style={{ padding: "16px 36px 0 36px" }}>
        <Eyebrow>0G AUTONOMOUS AGENTS · ERC-7857 iNFT</Eyebrow>
        <Title size={38}>The agent itself is an on-chain asset.</Title>
        <p
          style={{
            margin: "8px 0 0 0",
            fontSize: 14,
            lineHeight: 1.4,
            color: "var(--text-secondary)",
            maxWidth: 980,
          }}
        >
          Identity, persistent memory, and reputation — all native to 0G Chain. The Croisette pattern,
          applied to LP diagnostics.
        </p>
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
          padding: "10px 36px 24px 36px",
        }}
      >
        <INftCard />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
          <INftStat color={COLOR_AMBER} big="5" label="DIAGNOSES ANCHORED" sub="+1 reputation per anchored report" />
          <INftStat color={COLOR_GREEN} big="2" label="MIGRATIONS RECORDED" sub="+1 migrationsTriggered per Permit2 sign" />
          <INftStat color={COLOR_CYAN} big="80 / 20" label="ROYALTY SPLIT" sub="owner / treasury · auto on mintLicense" />
          <INftStat color={COLOR_VIOLET} big="0.1 OG" label="LICENSE / 24h WINDOW" sub="1 tx mintLicense · 86 336 gas" />
        </div>
      </div>
    </SlideShell>
  );
}

function INftCard() {
  return (
    <div
      style={{
        border: `1.5px solid ${COLOR_AMBER}`,
        borderRadius: 10,
        padding: "14px 22px",
        background: "rgba(255,176,32,0.03)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.22em",
            color: COLOR_AMBER,
          }}
        >
          INFT · ERC-7857 · LP DOCTOR/01
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: 4,
            border: `1px solid ${COLOR_AMBER}`,
            color: COLOR_AMBER,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.18em",
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: 999, background: COLOR_AMBER }} />
          ON-CHAIN
        </span>
      </div>
      <div
        style={{
          margin: "12px auto",
          width: 130,
          height: 85,
          border: `1px solid ${COLOR_AMBER}55`,
          borderRadius: 4,
          position: "relative",
          background: "radial-gradient(circle at 50% 60%, rgba(255,176,32,0.12) 0%, transparent 60%)",
        }}
      >
        <svg viewBox="0 0 120 80" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="deck-prism-mini" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(255,176,32,0.18)" />
              <stop offset="100%" stopColor="rgba(197,156,255,0.06)" />
            </linearGradient>
          </defs>
          <polygon
            points="60,18 95,62 25,62"
            stroke={COLOR_AMBER}
            strokeWidth="0.9"
            fill="url(#deck-prism-mini)"
            strokeLinejoin="round"
          />
          <line x1="14" y1="50" x2="50" y2="50" stroke="var(--text)" strokeWidth="0.4" opacity="0.6" />
          <line x1="70" y1="50" x2="112" y2="30" stroke={COLOR_AMBER} strokeWidth="0.4" />
          <line x1="70" y1="50" x2="112" y2="42" stroke={COLOR_GOLD} strokeWidth="0.4" />
          <line x1="70" y1="50" x2="112" y2="50" stroke={COLOR_GREEN} strokeWidth="0.4" />
          <line x1="70" y1="50" x2="112" y2="62" stroke={COLOR_RED} strokeWidth="0.4" />
          <line x1="70" y1="50" x2="112" y2="74" stroke={COLOR_VIOLET} strokeWidth="0.4" />
        </svg>
      </div>
      <dl style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)" }}>
        <INftRow label="AGENT iNFT" value="0x938f3B7841b3faCbBE967F90B548d991e9882c6C" labelColor={COLOR_AMBER} />
        <INftRow label="REPORTS" value="0x3b733eC427eeA5C379Bbd0CF50Dc0b931C5E00d3" labelColor={COLOR_GREEN} />
        <INftRow label="CHAIN" value="0G network · on-chain agent · tokenId 1" labelColor={COLOR_CYAN} />
        <INftRow label="OWNER" value="0x95eEe5d9d8d7D734EB29613E7Fd8e2875349b344" labelColor={COLOR_VIOLET} />
      </dl>
    </div>
  );
}

function INftRow({ label, value, labelColor }: { label: string; value: string; labelColor: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 12, padding: "5px 0" }}>
      <dt style={{ color: labelColor, letterSpacing: "0.18em" }}>{label}</dt>
      <dd style={{ margin: 0, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</dd>
    </div>
  );
}

function INftStat({
  color,
  big,
  label,
  sub,
}: {
  color: string;
  big: string;
  label: string;
  sub: string;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${color}`,
        borderRadius: 8,
        padding: "8px 14px",
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{big}</div>
      <div
        style={{
          marginTop: 2,
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: "0.22em",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div style={{ marginTop: 1, fontSize: 11, color: "var(--text-tertiary)" }}>{sub}</div>
    </div>
  );
}

// ─── 10 · AGENT-CALLABLE ────────────────────────────────────────────
function Slide10Callable() {
  return (
    <SlideShell
      index={10}
      marker="09 · AGENT-CALLABLE"
      caption="5 MCP tools — 3 actions gated by mintLicense (diagnose / preflight / migrate), 2 verifiers free (lookupReport / lookupReportOnChain)."
    >
      <div style={{ padding: "20px 36px 0 36px" }}>
        <Eyebrow>AGENT ECONOMY · MCP + mintLicense</Eyebrow>
        <Title size={42}>LP Doctor is an agent that other agents can hire.</Title>
        <Subtitle>
          Pay-per-window in OG via on-chain mintLicense — 80/20 royalty split. Verifiers stay free.
          (x402 USDC = roadmap.)
        </Subtitle>
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          gap: 28,
          padding: "16px 36px 24px 36px",
        }}
      >
        <ScreenshotFrame src="/deck/developers.png" alt="Developers page" />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              letterSpacing: "0.22em",
              color: "var(--text-tertiary)",
              marginBottom: 8,
            }}
          >
            FLOW
          </div>
          <FlowStep color={COLOR_CYAN} title="Claude Desktop" sub="(or any MCP client)" arrow="" />
          <FlowStep color={COLOR_AMBER} title="→ mintLicense (OG)" sub="0.1 OG · 24h window · 80/20" />
          <FlowStep color={COLOR_VIOLET} title="→ LPDoctor MCP server" sub="diagnose / preflight / migrate" />
          <FlowStep color={COLOR_GREEN} title="← Signed report" sub="rootHash + TEE attestation" />
        </div>
      </div>
    </SlideShell>
  );
}

function FlowStep({
  color,
  title,
  sub,
}: {
  color: string;
  title: string;
  sub: string;
  arrow?: string;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderLeft: `4px solid ${color}`,
        borderRadius: 6,
        padding: "10px 16px",
      }}
    >
      <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>{title}</div>
      <div style={{ marginTop: 2, fontSize: 13, color: color, fontFamily: "var(--font-mono)" }}>{sub}</div>
    </div>
  );
}

// ─── 11 · ARCHITECTURE ──────────────────────────────────────────────
function Slide11Architecture() {
  return (
    <SlideShell
      index={11}
      marker="10 · ARCHITECTURE"
      caption="Foundry + Solidity 0.8.24 contracts with agent memory updates anchored on-chain."
    >
      <div style={{ padding: "32px 36px 0 36px" }}>
        <Eyebrow>ARCHITECTURE</Eyebrow>
        <Title size={56}>Three stacks, one thesis.</Title>
        <Subtitle>
          Every component load-bearing, none decorative — Croisette scope discipline (3 services + iNFT,
          not Radegast 4-services-fragmented).
        </Subtitle>
      </div>
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 22,
          padding: "32px 36px 16px 36px",
        }}
      >
        <ArchColumn
          color={COLOR_AMBER}
          title="0G"
          tag="AI-NATIVE L1"
          rows={[
            ["Compute (TEE)", "qwen-2.5-7b verdicts on a 0G Compute TEE-attested provider + AT-4 hallucination guard"],
            ["Storage", "Report blob pinned → merkle rootHash returned, written into iNFT memoryRoot"],
            ["Chain", "LPDoctorReports + LPDoctorAgent (ERC-7857). 2 txs per diagnose"],
          ]}
        />
        <ArchColumn
          color={COLOR_VIOLET}
          title="Uniswap"
          tag="DEFI PROTOCOL"
          rows={[
            ["V3 + V4 subgraphs", "poolHourDatas, ticks, modifyLiquidities — Ethereum mainnet only"],
            ["Trading API", "/v1/quote priced into Permit2 migration preview"],
            ["Permit2 EIP-712", "PermitSingle — close V3 → swap → mint V4 in one signature"],
            ["V4 hooks (AT-2)", "1 000-swap mainnet replay through SwapMath, 0 bps drift"],
          ]}
        />
        <ArchColumn
          color={COLOR_GREEN}
          title="Agent state"
          tag="IDENTITY + MEMORY"
          rows={[
            ["ERC-7857 iNFT", "LPDoctorAgent stores owner, reputation, migrationsTriggered, and metadata"],
            ["memoryRoot", "Each anchored diagnose updates the agent's persistent memory cursor"],
            ["Verification", "Anyone can read agents(tokenId) directly from 0G Chain with cast call"],
          ]}
        />
      </div>
    </SlideShell>
  );
}

function ArchColumn({
  color,
  title,
  tag,
  rows,
}: {
  color: string;
  title: string;
  tag: string;
  rows: [string, string][];
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderTop: `4px solid ${color}`,
        borderRadius: 8,
        padding: "20px 22px",
      }}
    >
      <div style={{ fontSize: 32, fontWeight: 800, color, letterSpacing: "-0.02em" }}>{title}</div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.22em",
          color: "var(--text-tertiary)",
          marginTop: 4,
        }}
      >
        {tag}
      </div>
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map(([k, v], i) => (
          <div key={i}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{k}</div>
            <div style={{ marginTop: 2, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 12 · DIFFERENTIATION ───────────────────────────────────────────
function Slide12Differentiation() {
  const rows = [
    ["Parallax Wallet", "V4 LP wallet", "Auto-deploy via policy modules", "Diagnose-first, sign-once Permit2 migration"],
    ["CryptoBroCalls", "Voice agent + V4 LP RL", "PPO black-box decisions", "Rule-based replay (AT-2: 0 bps drift)"],
    ["ALP", "Auto-rebalanced V3/V4 vault", "Capital deployment, no diagnosis", "Per-position verdict, 5-path verifiable"],
    ["AdaptivePricing", "v4 dynamic-fee hook", "Hook author, not LP user", "LP-side advisor that replays your pool"],
    ["Revert Finance", "LP explorer", "Shows raw numbers", "Explains + acts + signs on-chain"],
    ["Uniswap Info", "Pool dashboard", "Pool-level only", "Position-level + hook counterfactual"],
  ];
  return (
    <SlideShell
      index={12}
      marker="11 · DIFFERENTIATION"
      caption="Adjacent designs: Parallax (V4 wallet), CryptoBroCalls (RL LP), ALP (vault). LP Doctor is the only diagnostic + sign-once migration agent in this set."
    >
      <div style={{ padding: "32px 36px 0 36px" }}>
        <Eyebrow>DIFFERENTIATION</Eyebrow>
        <Title size={54}>Adjacent agents serve adjacent users.</Title>
        <Subtitle>
          The only LP-position-level diagnostic agent that ships a verifiable migration action — and the only
          one that exposes its verifiers as free MCP tools.
        </Subtitle>
      </div>
      <div style={{ flex: 1, padding: "24px 36px 0 36px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr 1fr 1.5fr",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            overflow: "hidden",
            fontSize: 14,
          }}
        >
          {["AGENT / TOOL", "THEIR WEDGE", "WHERE THEY STOP", "WE START WHERE"].map((h) => (
            <div
              key={h}
              style={{
                padding: "14px 18px",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.22em",
                color: COLOR_AMBER,
                background: "rgba(255,176,32,0.04)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {h}
            </div>
          ))}
          {rows.map((r, i) => (
            <div key={i} style={{ display: "contents" }}>
              <Cell bold>{r[0]}</Cell>
              <Cell>{r[1]}</Cell>
              <Cell>{r[2]}</Cell>
              <Cell color={COLOR_AMBER} bold>
                {r[3]}
              </Cell>
            </div>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}

function Cell({
  children,
  bold,
  color,
}: {
  children: ReactNode;
  bold?: boolean;
  color?: string;
}) {
  return (
    <div
      style={{
        padding: "14px 18px",
        borderTop: "1px solid var(--border-faint)",
        color: color ?? "var(--text)",
        fontWeight: bold ? 700 : 400,
      }}
    >
      {children}
    </div>
  );
}

// ─── 13 · TRACKS ────────────────────────────────────────────────────
function Slide13Tracks() {
  return (
    <SlideShell
      index={13}
      marker="12 · TRACKS"
      caption="Realistic combined ceiling : $3k–$5k + Top-10 finalist eligible. Single-thesis discipline (no track-stuffing)."
    >
      <div style={{ padding: "28px 36px 0 36px" }}>
        <Eyebrow>TRACKS TARGETED</Eyebrow>
        <Title size={48}>
          Three coherent partner slots — single thesis, no fragmentation.
        </Title>
        <Subtitle>Maximum allowed by &lt;HACKATHON_OR_SUBMISSION_CONTEXT&gt;. Slot picks below.</Subtitle>
      </div>
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 22,
          padding: "20px 36px 0 36px",
        }}
      >
        <TrackColumn
          color={COLOR_AMBER}
          title="0G"
          tag="AUTONOMOUS AGENTS · INFT · $7.5K POOL"
          headline="Agent = ERC-7857 iNFT"
          bullets={["Compute TEE for inference", "Storage for memory + reports", "Chain for iNFT + reports registry"]}
          footnote="5 slots × $1.5k — single-thesis Croisette playbook"
        />
        <TrackColumn
          color={COLOR_VIOLET}
          title="Uniswap Foundation"
          tag="BEST API INTEGRATION · $5K"
          headline="4 primitives load-bearing"
          bullets={["Subgraph (tick history)", "Trading API (/v1/quote)", "Permit2 (atomic migration)", "V4 hooks (replay simulator)"]}
          footnote="FEEDBACK.md written from real usage friction"
        />
        <TrackColumn
          color={COLOR_GREEN}
          title="Open Agents"
          tag="AGENTIC UX + INTEROP"
          headline="Callable by other agents"
          bullets={["MCP server with 5 tools", "3 paid actions + 2 free verifiers", "Agent memory and royalties enforced on-chain"]}
          footnote="Extends beyond UI into agent-to-agent usage"
        />
      </div>
    </SlideShell>
  );
}

function TrackColumn({
  color,
  title,
  tag,
  headline,
  bullets,
  footnote,
}: {
  color: string;
  title: string;
  tag: string;
  headline: string;
  bullets: string[];
  footnote: string;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderTop: `4px solid ${color}`,
        borderRadius: 8,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{title}</div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: "0.22em",
          color: "var(--text-tertiary)",
        }}
      >
        {tag}
      </div>
      <div
        style={{
          padding: "10px 14px",
          border: `1px solid ${color}`,
          borderRadius: 6,
          fontStyle: "italic",
          fontSize: 14,
          fontWeight: 700,
          background: `${color}11`,
        }}
      >
        {headline}
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
        {bullets.map((b, i) => (
          <li key={i} style={{ display: "flex", gap: 10, alignItems: "baseline", fontSize: 14 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                background: color,
                flexShrink: 0,
                marginTop: 6,
              }}
            />
            {b}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: "auto", fontSize: 12, fontStyle: "italic", color: "var(--text-tertiary)" }}>
        {footnote}
      </div>
    </div>
  );
}

// ─── 14 · TRY IT ────────────────────────────────────────────────────
function Slide14Try() {
  return (
    <SlideShell
      index={14}
      marker="13 · TRY IT"
      caption="Thanks to ETHGlobal, 0G Labs, Uniswap Foundation, and the Open Agents partners."
    >
      <div style={{ padding: "32px 36px 0 36px" }}>
        <Eyebrow>LIVE DEMO + CODE</Eyebrow>
        <Title size={56}>Try it. Read it. Fork it.</Title>
        <Subtitle>
          Six demo wallets, one live agent, one signed report per click. Open repo with live backend proof —
          bring your own wallet if you prefer.
        </Subtitle>
      </div>
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 22,
          padding: "32px 36px 16px 36px",
        }}
      >
        <TryColumn color={COLOR_AMBER} title="LIVE DEMO">
          <div style={{ fontSize: 36, fontFamily: "var(--font-display)", fontWeight: 800 }}>&lt;YOUR_DEMO_URL_OR_PLACEHOLDER&gt;</div>
          <div style={{ marginTop: 10, fontFamily: "var(--font-mono)", fontSize: 13, color: COLOR_CYAN }}>
            MCP : self-host (STDIO) · &lt;YOUR_MCP_URL_OR_STATUS&gt;
          </div>
          <div style={{ marginTop: 16, fontStyle: "italic", color: "var(--text-secondary)", fontSize: 13 }}>
            Six demo wallets pinned :
          </div>
          <ul style={{ margin: "8px 0 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            <DemoBullet color={COLOR_VIOLET} label="multi-position whale" sub="V3 + V4 mixed book" />
            <DemoBullet color={COLOR_GREEN} label="healthy" sub="in-range, fees > deposit" />
            <DemoBullet color={COLOR_GOLD} label="drifting" sub="close-to-edge" />
            <DemoBullet color={COLOR_RED} label="bleeding" sub="out-of-range, IL dominant" />
          </ul>
        </TryColumn>
        <TryColumn color={COLOR_VIOLET} title="OPEN REPO">
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 16,
              fontWeight: 700,
              lineHeight: 1.4,
              wordBreak: "break-all",
            }}
          >
            &lt;YOUR_REPOSITORY_URL&gt;
          </div>
          <ul style={{ marginTop: 16, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
            {[
              "TypeScript pnpm monorepo",
              "Foundry + Solidity 0.8.24",
              "Postgres + pgvector + Redis",
              "Real commits per phase",
              "DEMO.md walkthrough",
              "FEEDBACK.md (Uniswap req.)",
            ].map((b, i) => (
              <li key={i} style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: COLOR_VIOLET, marginTop: 6 }} />
                {b}
              </li>
            ))}
          </ul>
        </TryColumn>
        <TryColumn color={COLOR_GREEN} title="TEAM">
          <div style={{ fontSize: 36, fontFamily: "var(--font-display)", fontWeight: 800 }}>&lt;YOUR_TEAM_NAME&gt;</div>
          <div style={{ marginTop: 10, color: "var(--text-secondary)", fontSize: 13, fontStyle: "italic" }}>
            &lt;YOUR_TEAM_TAGLINE_OR_SHORT_DESCRIPTION&gt;
          </div>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
            <LensRow color={COLOR_CYAN} name="<PROJECT / TEAM ITEM 1>" sub="<DESCRIPTION>" />
            <LensRow color={COLOR_VIOLET} name="<PROJECT / TEAM ITEM 2>" sub="<DESCRIPTION>" />
            <LensRow color={COLOR_GREEN} name="<PROJECT / TEAM ITEM 3>" sub="<DESCRIPTION>" />
            <LensRow color={COLOR_AMBER} name="LP Doctor" sub="<CURRENT_HACKATHON_OR_POSITIONING>" />
          </div>
        </TryColumn>
      </div>
    </SlideShell>
  );
}

function TryColumn({ color, title, children }: { color: string; title: string; children: ReactNode }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderTop: `4px solid ${color}`,
        borderRadius: 8,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.22em",
          color,
          fontWeight: 600,
        }}
      >
        {title}
      </div>
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  );
}

function DemoBullet({ color, label, sub }: { color: string; label: string; sub: string }) {
  return (
    <li style={{ display: "flex", gap: 10, alignItems: "baseline", fontSize: 14 }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: color, marginTop: 6 }} />
      <span>
        <strong style={{ color }}>{label}</strong>
        <span style={{ color: "var(--text-tertiary)", marginLeft: 6, fontSize: 12 }}>{sub}</span>
      </span>
    </li>
  );
}

function LensRow({ color, name, sub }: { color: string; name: string; sub: string }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: color, marginTop: 6 }} />
      <div>
        <strong style={{ color }}>{name}</strong>
        <div style={{ fontSize: 12, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>{sub}</div>
      </div>
    </div>
  );
}

// ─── PAGE ───────────────────────────────────────────────────────────
export function Deck() {
  // Track current slide via scroll position so the bottom indicator
  // updates without polluting the URL (no per-slide hash).
  const [active, setActive] = useState(1);
  useEffect(() => {
    const handler = () => {
      const idx = Math.round(window.scrollY / window.innerHeight) + 1;
      setActive(Math.min(Math.max(idx, 1), TOTAL_SLIDES));
    };
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Keyboard nav: arrow / space / page keys jump one slide at a time.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const next = ["ArrowRight", "ArrowDown", "PageDown", " "].includes(e.key);
      const prev = ["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key);
      if (!next && !prev) return;
      e.preventDefault();
      const target = Math.min(
        Math.max((Math.round(window.scrollY / window.innerHeight) + (next ? 1 : -1)), 0),
        TOTAL_SLIDES - 1,
      );
      window.scrollTo({ top: target * window.innerHeight, behavior: "smooth" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main
      style={{
        scrollSnapType: "y mandatory",
        height: "100vh",
        overflowY: "auto",
        scrollBehavior: "smooth",
      }}
    >
      <Slide01Cover />
      <Slide02Pain />
      <Slide03Landscape />
      <Slide04Thesis />
      <Slide05Atlas />
      <Slide06Diagnose />
      <Slide07Provenance />
      <Slide08Migration />
      <Slide09INft />
      <Slide10Callable />
      <Slide11Architecture />
      <Slide12Differentiation />
      <Slide13Tracks />
      <Slide14Try />

      {/* Floating slide counter */}
      <div
        style={{
          position: "fixed",
          right: 18,
          bottom: 18,
          padding: "8px 14px",
          borderRadius: 6,
          background: "rgba(20,22,32,0.85)",
          border: "1px solid var(--border)",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--text-secondary)",
          letterSpacing: "0.16em",
          pointerEvents: "none",
          backdropFilter: "blur(6px)",
        }}
      >
        {String(active).padStart(2, "0")} / {TOTAL_SLIDES}
      </div>
    </main>
  );
}
