import { useNavigate } from "react-router-dom";
import { AppHeader } from "../components/AppHeader.js";
import { HeroFilm } from "../components/HeroFilm.js";
import { Cap, Dot, Mono } from "../design/atoms.js";

export function Landing() {
  const nav = useNavigate();
  return (
    <div>
      {/* ─── 1 · Hero — slide-01 reference, left-aligned ──────────────── */}
      <section
        style={{
          position: "relative",
          minHeight: "92vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <HeroFilm />
        <AppHeader />
        <div
          style={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            display: "flex",
            alignItems: "center",
            padding: "0 36px",
          }}
        >
          <div style={{ maxWidth: 1200, width: "100%", margin: "0 auto" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 28,
                opacity: 0.9,
              }}
            >
              <Dot color="cyan" pulse />
              <Cap style={{ color: "var(--cyan)" }}>
                ENCLAVE · LIVE · 0G COMPUTE TEE
              </Cap>
              <Mono color="text-tertiary" style={{ fontSize: 11 }}>
                broker-verifiable attestation
              </Mono>
            </div>
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: "clamp(40px, 6.2vw, 86px)",
                lineHeight: 1.02,
                fontWeight: 500,
                letterSpacing: "-0.035em",
                maxWidth: 1000,
                color: "var(--text)",
                textWrap: "balance",
              }}
            >
              See why your LP position is{" "}
              <span style={{ color: "var(--bleed)" }}>bleeding</span>.
              <br />
              <span style={{ color: "var(--text-secondary)" }}>In</span>{" "}
              <Mono color="cyan" style={{ fontSize: "0.82em" }}>
                30
              </Mono>{" "}
              <span style={{ color: "var(--text-secondary)" }}>seconds.</span>
            </h1>
            <p
              style={{
                marginTop: 28,
                maxWidth: 640,
                fontSize: 17,
                lineHeight: 1.55,
                color: "var(--text-secondary)",
                textWrap: "pretty",
              }}
            >
              LP Doctor is an autonomous agent on 0G that reads your Uniswap V3
              and V4 positions, decomposes your impermanent loss from the
              tick range, replays every V4 hook against the last 1 000 swaps
              swap-by-swap, and migrates you in a single Permit2 signature.
            </p>
            <div
              style={{
                display: "flex",
                gap: 12,
                marginTop: 36,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                className="btn btn-primary"
                onClick={() => nav("/atlas")}
                style={{ padding: "14px 22px", fontSize: 14 }}
              >
                Connect wallet
                <Arrow />
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => nav("/diagnose/605311")}
                style={{ padding: "14px 22px", fontSize: 14 }}
              >
                <PlayIcon />
                Watch a live diagnose
              </button>
            </div>
          </div>
        </div>
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            justifyContent: "center",
            padding: "0 36px 28px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--text-tertiary)", fontSize: 11 }}>
            <div style={{ width: 40, height: 1, background: "var(--border-strong)" }} />
            <Cap>Scroll · how it works</Cap>
            <div style={{ width: 40, height: 1, background: "var(--border-strong)" }} />
          </div>
        </div>
      </section>

      {/* ─── 2 · Stats row ────────────────────────────────────────────── */}
      <section style={{ padding: "56px 36px", borderBottom: "1px solid var(--border)" }}>
        <div
          style={{
            maxWidth: 920,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 32,
          }}
        >
          <Stat value="1 000" label="swaps replayed" sub="0 bps drift vs mainnet" />
          <Stat value="5" label="verification paths" sub="no LP Doctor server in trust" />
          <Stat value="0" label="keys in custody" sub="user signs, agent never executes" />
        </div>
      </section>

      {/* ─── 2b · Powered-by strip ────────────────────────────────────── */}
      <section style={{ padding: "44px 36px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.3em",
              color: "var(--text-tertiary)",
            }}
          >
            Built on
          </span>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "flex-start",
              gap: 40,
              rowGap: 16,
            }}
          >
            <Partner name="0G Labs" sub="AI-native L1 — TEE compute, storage, chain" />
            <Partner name="Uniswap Foundation" sub="V3+V4 subgraphs, Trading API, Permit2" />
            <Partner name="ENS Labs" sub="agent identity & output index" />
            <Partner name="ERC-7857" sub="iNFT standard for embedded intelligence" />
            <Partner name="MCP" sub="@modelcontextprotocol/sdk — agent-callable tools" />
            <Partner name="ETHGlobal" sub="Open Agents 2026" />
          </div>
        </div>
      </section>

      {/* ─── 3 · Three products grid (clickable) ──────────────────────── */}
      <section style={{ padding: "100px 36px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <Cap style={{ color: "var(--cyan)" }}>THREE SURFACES, ONE AGENT</Cap>
          <h2
            style={{
              margin: "12px 0 16px",
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 4vw, 48px)",
              fontWeight: 500,
              letterSpacing: "-0.025em",
              textWrap: "balance",
            }}
          >
            Browse positions. Diagnose live. Hire the agent.
          </h2>
          <p
            style={{
              margin: "0 auto",
              maxWidth: 680,
              color: "var(--text-secondary)",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            Each surface routes to the same on-chain agent — same iNFT, same
            verifiable reports, same MCP server.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 20,
          }}
        >
          <ProductCard
            badge="ATLAS"
            title="See every LP at a glance."
            desc="Paste any wallet — V3 + V4 positions classified live by the agent. Six curated demo wallets pin the green / amber / red / portfolio narratives."
            cta="Open Atlas →"
            onClick={() => nav("/atlas")}
          />
          <ProductCard
            badge="AGENT"
            title="The iNFT, in real time."
            desc="LP Doctor/01 — ERC-7857 on 0G Galileo. Live memoryRoot, reputation counter, migrationsTriggered, license terms — all read direct from chain every 30 s."
            cta="Open /agent →"
            onClick={() => nav("/agent")}
          />
          <ProductCard
            badge="DEVELOPERS"
            title="Hire LP Doctor from any agent."
            desc="MCP server, 6 tools. Three free verifiers, three gated by mintLicense (0.1 OG / 24 h, 80/20 royalty split). cast-send snippets included."
            cta="Open /developers →"
            onClick={() => nav("/developers")}
          />
        </div>
      </section>

      {/* ─── 4 · How the agent works — 2-col text + visual ────────────── */}
      <section
        style={{
          padding: "100px 36px",
          background: "rgba(15, 22, 40, 0.5)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "minmax(280px, 1fr) minmax(320px, 1.4fr)",
            gap: 56,
            alignItems: "center",
          }}
        >
          <div>
            <Cap style={{ color: "var(--cyan)" }}>HOW IT WORKS</Cap>
            <h2
              style={{
                margin: "12px 0 16px",
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 3.4vw, 40px)",
                fontWeight: 500,
                letterSpacing: "-0.025em",
                textWrap: "balance",
              }}
            >
              Ten phases. Streamed live over SSE.
            </h2>
            <p
              style={{
                margin: 0,
                color: "var(--text-secondary)",
                fontSize: 14,
                lineHeight: 1.65,
              }}
            >
              No spinner, no black box. Every phase emits a typed event the
              user watches in real time — position resolution, IL math, regime
              classification, hook discovery, swap-by-swap replay, migration
              preview, TEE verdict synthesis with hallucination guard, 0G
              Storage upload, on-chain anchor, ENS publish.
            </p>
          </div>
          <div
            style={{
              padding: 24,
              borderRadius: 12,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              lineHeight: 1.9,
              color: "var(--text-secondary)",
            }}
          >
            {[
              ["01", "position.resolve", "VERIFIED"],
              ["03", "il.reconstruct", "COMPUTED"],
              ["04", "regime.classify", "ESTIMATED"],
              ["05", "hooks.discover", "LABELED"],
              ["06", "hook.replay (1k swaps)", "COMPUTED"],
              ["07", "migration.preview", "COMPUTED"],
              ["10", "verdict.synthesize (TEE)", "ESTIMATED"],
              ["08", "report.upload (0G)", "VERIFIED"],
              ["09", "anchor.0g-chain + iNFT update", "VERIFIED"],
              ["11", "ens.publish (Sepolia)", "VERIFIED"],
            ].map(([n, name, label]) => (
              <PhaseRow key={String(n) + name} n={n!} name={name!} label={label!} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5 · Five-path verification deep-dive ─────────────────────── */}
      <section style={{ padding: "100px 36px", maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
        <Cap style={{ color: "var(--cyan)" }}>VERIFICATION MATRIX</Cap>
        <h2
          style={{
            margin: "12px 0 16px",
            fontFamily: "var(--font-display)",
            fontSize: "clamp(32px, 4vw, 48px)",
            fontWeight: 500,
            letterSpacing: "-0.025em",
            textWrap: "balance",
          }}
        >
          Five paths, one rootHash, no LP Doctor server in the trust.
        </h2>
        <p
          style={{
            margin: "0 auto 56px",
            maxWidth: 720,
            color: "var(--text-secondary)",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          Same hash, five independent surfaces. The AT-4 hallucination guard
          fires <em>before</em> anchoring, so unsupported model claims never
          reach any of them.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            textAlign: "left",
          }}
        >
          <PathCard n="A" name="LP Doctor REST" sub="GET /api/report/<rootHash>" />
          <PathCard n="B" name="0G Chain registry" sub="LPDoctorReports.reports(rootHash)" />
          <PathCard n="C" name="iNFT memoryRoot" sub="agents(1).memoryRoot" />
          <PathCard n="D" name="ENS text record" sub="lpdoctor.<tokenId>.rootHash" />
          <PathCard n="E" name="0G Storage merkle" sub="root re-derived from blob" />
        </div>
      </section>

      {/* ─── 6 · Agent economy capabilities ───────────────────────────── */}
      <section
        style={{
          padding: "100px 36px",
          background: "rgba(15, 22, 40, 0.5)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <Cap style={{ color: "var(--cyan)" }}>AGENT ECONOMY</Cap>
          <h2
            style={{
              margin: "12px 0 16px",
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 4vw, 48px)",
              fontWeight: 500,
              letterSpacing: "-0.025em",
              textWrap: "balance",
            }}
          >
            The intelligence is in the cursor — and the cursor is rentable.
          </h2>
          <p
            style={{
              margin: "0 auto 56px",
              maxWidth: 720,
              color: "var(--text-secondary)",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            Three counters that move on chain per agent action, plus a
            licensing primitive that splits revenue automatically.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 20,
              textAlign: "left",
            }}
          >
            <CapabilityCard
              tag="01"
              title="mintLicense — 80/20 royalty"
              desc="Pay 0.1 OG for a 24 h license to invoke the agent's gated MCP tools. Owner gets 80 %, treasury 20 %, automatic split."
            />
            <CapabilityCard
              tag="02"
              title="memoryRoot evolves per run"
              desc="Each diagnose updates agents(1).memoryRoot to the new 0G Storage blob — cast call agents(1) always returns the latest report's hash."
            />
            <CapabilityCard
              tag="03"
              title="reputation + migrationsTriggered"
              desc="Two on-chain counters move per run. recordDiagnose bumps reputation. recordMigration bumps migrationsTriggered when the user signs."
            />
            <CapabilityCard
              tag="04"
              title="6 MCP tools — 3 gated, 3 free"
              desc="diagnose / preflight / migrate require a license. lookupReport / lookupReportOnChain / resolveEnsRecord stay public — verification is a public good."
            />
          </div>
        </div>
      </section>

      {/* ─── 7 · Method · 3 phases (technical recap) ──────────────────── */}
      <section style={{ padding: "100px 36px", maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
        <Cap style={{ color: "var(--cyan)" }}>METHOD · 3 PHASES</Cap>
        <h2
          style={{
            margin: "12px 0 16px",
            fontFamily: "var(--font-display)",
            fontSize: "clamp(32px, 4vw, 48px)",
            fontWeight: 500,
            letterSpacing: "-0.025em",
            textWrap: "balance",
          }}
        >
          A lens, not a dashboard.
        </h2>
        <p
          style={{
            margin: "0 auto 56px",
            maxWidth: 640,
            color: "var(--text-secondary)",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          Every position ships with a signed, reproducible diagnosis. You keep
          the verdict; your keys never leave your wallet.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 20,
            textAlign: "left",
          }}
        >
          <HowCard
            n="01"
            label="DIAGNOSE"
            title="Read the position with a microscope."
            desc="The agent pulls your tokenId, decodes the tick range, and reconstructs IL from the current sqrtPriceX96 against the deposit price (Uniswap whitepaper closed-form). Output: a decomposed loss attribution."
          />
          <HowCard
            n="02"
            label="SIMULATE"
            title="Score every V4 hook, in a sealed enclave."
            desc="Candidate hooks are replayed against the exact swap stream your pool experienced. Counterfactual P&L, fee capture, and LVR are measured."
          />
          <HowCard
            n="03"
            label="MIGRATE"
            title="One signature. Three on-chain moves."
            desc="Close V3 → swap → mint V4, bundled through Permit2. Report signed inside the TEE, pinned to 0G Storage, anchored on 0G Chain for audit."
          />
        </div>
      </section>

      {/* ─── 8 · Competitive positioning ──────────────────────────────── */}
      <section
        style={{
          padding: "100px 36px",
          background: "rgba(15, 22, 40, 0.5)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <Cap style={{ color: "var(--cyan)" }}>THE GAP WE FILL</Cap>
            <h2
              style={{
                margin: "12px 0 16px",
                fontFamily: "var(--font-display)",
                fontSize: "clamp(32px, 4vw, 48px)",
                fontWeight: 500,
                letterSpacing: "-0.025em",
                textWrap: "balance",
              }}
            >
              Adjacent tools show the loss — none explain it.
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr repeat(4, 1fr)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              overflow: "hidden",
              fontSize: 13,
            }}
          >
            <CompCellHead>Capability</CompCellHead>
            <CompCellHead>Revert Finance</CompCellHead>
            <CompCellHead>Uniswap Info</CompCellHead>
            <CompCellHead>Etherscan</CompCellHead>
            <CompCellHead accent>LP Doctor</CompCellHead>
            <CompRow
              cells={[
                "Position-level IL breakdown",
                "per-position IL + APR",
                "—",
                "—",
                "✓ COMPUTED + decomposed",
              ]}
            />
            <CompRow
              cells={[
                "V4 hook scoring vs your pool",
                "—",
                "—",
                "—",
                "✓ replay 1 000 swaps · 0 bps drift",
              ]}
            />
            <CompRow
              cells={[
                "Permit2 sign-once migration",
                "—",
                "—",
                "—",
                "✓ EIP-712 typed data ready",
              ]}
            />
            <CompRow
              cells={[
                "Signed verdict, on-chain anchored",
                "—",
                "—",
                "—",
                "✓ 5 verification paths",
              ]}
            />
            <CompRow
              cells={[
                "Callable by other agents",
                "—",
                "—",
                "—",
                "✓ MCP server, 6 tools",
              ]}
            />
          </div>
        </div>
      </section>

      {/* ─── 8b · Five anchor lines ───────────────────────────────────── */}
      <section style={{ padding: "100px 36px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Cap style={{ color: "var(--cyan)" }}>FIVE ANCHORS</Cap>
          <h2
            style={{
              margin: "12px 0 16px",
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 4vw, 48px)",
              fontWeight: 500,
              letterSpacing: "-0.025em",
              textWrap: "balance",
            }}
          >
            Five design choices that hold the project up.
          </h2>
          <p
            style={{
              margin: "0 auto",
              maxWidth: 720,
              color: "var(--text-secondary)",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            Each one is a deliberate constraint that's verifiable in the code or
            on chain. Take any one away and the trust story collapses.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <AnchorLine
            tag="01 · DIAGNOSTIC, NOT AUTO-DEPLOY"
            body="LP Doctor does not deploy your capital. It diagnoses why your LP is bleeding, signs the report inside a TEE, and proposes a V4 migration only if the simulation backtests positively. The agent never executes — the user keeps custody."
          />
          <AnchorLine
            tag="02 · HONESTY LAYER"
            body="Every numeric output carries one of five labels: VERIFIED, COMPUTED, ESTIMATED, EMULATED, LABELED. If the agent did not backtest a hook against the pool's real swaps, it says so. The hallucination guard fires before anchoring — unsupported claims never reach any of the five verification surfaces."
          />
          <AnchorLine
            tag="03 · V4 HOOK REPLAY, NOT HEURISTIC"
            body="We do not guess if a V4 hook will help your pool. We replay the pool's last 1 000 mainnet swaps through the candidate hook via SwapMath.computeSwapStep and show the counterfactual IL — at 0 bps drift vs on-chain post-swap state."
          />
          <AnchorLine
            tag="04 · SIGNED REPORT, NOT A SCREENSHOT"
            body="The verdict is a blob signed by a 0G Compute TEE-attested provider, pinned on 0G Storage, anchored on 0G Chain. Forwardable to a DAO. Verifiable offline by anyone with the rootHash and the registry address — no LP Doctor server in the trust path."
          />
          <AnchorLine
            tag="05 · ENS DOES REAL WORK"
            body="The agent's ENS name resolves its on-chain memory cursor. Five text records per diagnose key the rootHash, storageUrl, anchorTx, chainId, and verdict — indexed by Uniswap position tokenId. ENS becomes the queryable memory of the agent economy here. Not a vanity name."
          />
        </div>
      </section>

      {/* ─── 9 · Closing CTA ──────────────────────────────────────────── */}
      <section style={{ padding: "100px 36px", maxWidth: 920, margin: "0 auto", textAlign: "center" }}>
        <h2
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: "clamp(28px, 3.5vw, 40px)",
            fontWeight: 500,
            letterSpacing: "-0.025em",
            textWrap: "balance",
          }}
        >
          Six demo wallets. One live agent. One signed report per click.
        </h2>
        <p
          style={{
            margin: "20px auto 32px",
            maxWidth: 560,
            color: "var(--text-secondary)",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          Bring your own wallet, or pick a curated demo. The pipeline runs
          end-to-end on real chain data — no mocks, no canned responses.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => nav("/atlas")}
          style={{ padding: "14px 28px", fontSize: 14 }}
        >
          Open the Atlas
          <Arrow />
        </button>
      </section>

      {/* ─── 10 · Instrument stack (tech proof footer) ────────────────── */}
      <section
        style={{
          padding: "60px 36px",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          background: "rgba(15, 22, 40, 0.5)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24, alignItems: "center", textAlign: "center" }}>
          <Cap style={{ color: "var(--text-tertiary)" }}>INSTRUMENT STACK</Cap>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 24,
              width: "100%",
            }}
          >
            <TrustItem name="0G Compute" sub="TEE · broker-attested" />
            <TrustItem name="0G Storage" sub="merkle rootHash anchored" />
            <TrustItem name="0G Chain" sub="LPDoctorReports + iNFT registry" />
            <TrustItem name="Uniswap V3 / V4" sub="mainnet · sepolia" />
            <TrustItem name="Permit2" sub="EIP-712 signed bundle" />
            <TrustItem name="ENS" sub="pending ENS setup" />
            <TrustItem name="ERC-7857" sub="iNFT agent identity" />
            <TrustItem name="MCP" sub="6 tools · agent-callable" />
          </div>
        </div>
      </section>

      {/* ─── 11 · Footer ───────────────────────────────────────────────── */}
      <footer style={{ padding: "32px 36px", borderTop: "1px solid var(--border)" }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            color: "var(--text-tertiary)",
            fontSize: 11,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <Mono color="text-tertiary">GALILEO TESTNET</Mono>
          <span>© 2026 LP Doctor</span>
        </div>
      </footer>
    </div>
  );
}

/* ─── small atoms (kept inline so Landing stays self-contained) ───── */

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.5 4.5L9.5 7L5.5 9.5V4.5Z" fill="currentColor" />
    </svg>
  );
}

interface StatProps {
  value: string;
  label: string;
  sub: string;
}
function Stat({ value, label, sub }: StatProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
      <span style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 500, color: "var(--cyan)", letterSpacing: "-0.02em" }}>
        {value}
      </span>
      <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-secondary)" }}>
        {label}
      </span>
      <Mono color="text-tertiary" style={{ fontSize: 10 }}>
        {sub}
      </Mono>
    </div>
  );
}

interface PartnerProps {
  name: string;
  sub: string;
}
function Partner({ name, sub }: PartnerProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>
        {name}
      </span>
      <Mono color="text-tertiary" style={{ fontSize: 9 }}>
        {sub}
      </Mono>
    </div>
  );
}

interface ProductCardProps {
  badge: string;
  title: string;
  desc: string;
  cta: string;
  onClick: () => void;
}
function ProductCard({ badge, title, desc, cta, onClick }: ProductCardProps) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left",
        padding: 28,
        borderRadius: 12,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        cursor: "pointer",
        transition: "border-color 160ms, transform 160ms",
        font: "inherit",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--cyan)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <Cap style={{ color: "var(--cyan)" }}>{badge}</Cap>
      <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em" }}>
        {title}
      </h3>
      <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.55, textWrap: "pretty" }}>
        {desc}
      </p>
      <span style={{ marginTop: "auto", color: "var(--cyan)", fontSize: 12, fontFamily: "var(--font-mono)" }}>
        {cta}
      </span>
    </button>
  );
}

interface PhaseRowProps {
  n: string;
  name: string;
  label: string;
}
const PHASE_LABEL_TONE: Record<string, string> = {
  VERIFIED: "var(--healthy)",
  COMPUTED: "var(--cyan)",
  ESTIMATED: "var(--toxic)",
  EMULATED: "var(--bleed)",
  LABELED: "var(--violet, #b48cff)",
};
function PhaseRow({ n, name, label }: PhaseRowProps) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <span style={{ color: "var(--text-tertiary)" }}>{n}</span>
      <span style={{ flex: 1, color: "var(--text)" }}>{name}</span>
      <span style={{ fontSize: 9, color: PHASE_LABEL_TONE[label] ?? "var(--text-tertiary)" }}>{label}</span>
    </div>
  );
}

interface PathCardProps {
  n: string;
  name: string;
  sub: string;
}
function PathCard({ n, name, sub }: PathCardProps) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 10,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--cyan)", letterSpacing: "-0.02em" }}>
        {n}
      </span>
      <span style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "var(--text)" }}>{name}</span>
      <Mono color="text-tertiary" style={{ fontSize: 10 }}>
        {sub}
      </Mono>
    </div>
  );
}

interface AnchorLineProps {
  tag: string;
  body: string;
}
function AnchorLine({ tag, body }: AnchorLineProps) {
  return (
    <div
      style={{
        position: "relative",
        padding: "26px 32px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderLeft: "4px solid var(--cyan)",
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <Cap style={{ color: "var(--cyan)", fontSize: 11 }}>{tag}</Cap>
      <p
        style={{
          margin: 0,
          color: "var(--text)",
          fontSize: 15,
          lineHeight: 1.6,
          textWrap: "pretty",
        }}
      >
        {body}
      </p>
    </div>
  );
}

interface CapabilityCardProps {
  tag: string;
  title: string;
  desc: string;
}
function CapabilityCard({ tag, title, desc }: CapabilityCardProps) {
  return (
    <div
      style={{
        position: "relative",
        padding: 28,
        borderRadius: 12,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background:
            "linear-gradient(90deg, transparent, var(--cyan), transparent)",
          opacity: 0.3,
        }}
      />
      <Mono color="text-tertiary" style={{ fontSize: 11 }}>
        {tag}
      </Mono>
      <h3
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontSize: 18,
          fontWeight: 500,
          letterSpacing: "-0.015em",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          margin: 0,
          color: "var(--text-secondary)",
          fontSize: 13,
          lineHeight: 1.55,
        }}
      >
        {desc}
      </p>
    </div>
  );
}

function CompCellHead({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        background: accent ? "rgba(255, 176, 32, 0.08)" : "var(--surface-raised)",
        color: accent ? "var(--cyan)" : "var(--text-tertiary)",
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        fontWeight: 600,
        borderRight: "1px solid var(--border)",
      }}
    >
      {children}
    </div>
  );
}

function CompRow({ cells }: { cells: string[] }) {
  return (
    <>
      {cells.map((c, i) => {
        const isFirst = i === 0;
        const isLast = i === cells.length - 1;
        const isCheck = c.startsWith("✓");
        return (
          <div
            key={i}
            style={{
              padding: "12px 16px",
              borderTop: "1px solid var(--border)",
              borderRight: i < cells.length - 1 ? "1px solid var(--border)" : "none",
              color: isFirst ? "var(--text)" : isLast ? "var(--cyan)" : "var(--text-tertiary)",
              fontWeight: isFirst ? 500 : 400,
              background: isLast ? "rgba(255, 176, 32, 0.04)" : "transparent",
              fontSize: 12.5,
            }}
          >
            {c}
          </div>
        );
      })}
    </>
  );
}

interface HowCardProps {
  n: string;
  label: string;
  title: string;
  desc: string;
}
function HowCard({ n, label, title, desc }: HowCardProps) {
  return (
    <div
      style={{
        position: "relative",
        padding: 28,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: "linear-gradient(90deg, transparent, var(--cyan), transparent)",
          opacity: 0.3,
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
        <Mono color="text-tertiary" style={{ fontSize: 12 }}>
          {n}
        </Mono>
        <Cap style={{ color: "var(--cyan)" }}>{label}</Cap>
      </div>
      <h3 style={{ margin: "0 0 12px 0", fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em" }}>
        {title}
      </h3>
      <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.55, textWrap: "pretty" }}>
        {desc}
      </p>
    </div>
  );
}

interface TrustItemProps {
  name: string;
  sub: string;
}
function TrustItem({ name, sub }: TrustItemProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
      <span style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "var(--text)", letterSpacing: "-0.01em" }}>
        {name}
      </span>
      <Mono color="text-tertiary" style={{ fontSize: 10 }}>
        {sub}
      </Mono>
    </div>
  );
}
