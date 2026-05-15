import { AppHeader } from "../components/AppHeader.js";
import { useAgentLiveState } from "../hooks/useAgentLiveState.js";

// /agent — live profile page for the LPDoctor iNFT.
// Pulls agents(tokenId) + protocolTreasury + protocolFeeBps from
// LPDoctorAgent on 0G Galileo every 30 s and renders the on-chain truth.
// No fabricated stats: every number rendered here traces back to a
// chain read the visitor can verify with `cast call`.

function shortHex(hex: string, head = 10, tail = 6): string {
  if (!hex) return "—";
  if (hex.length <= head + tail + 1) return hex;
  return `${hex.slice(0, head)}…${hex.slice(-tail)}`;
}

function fmtTimestamp(unix: number): string {
  if (!unix) return "never";
  return new Date(unix * 1000).toISOString().replace("T", " ").slice(0, 19);
}

function explorerAddress(addr: string): string {
  return `https://chainscan-galileo.0g.ai/address/${addr}`;
}

export function Agent() {
  const { data, loading, error } = useAgentLiveState();

  return (
    <div>
      <AppHeader />
      <main
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "48px 36px",
        }}
      >
        <div style={{ marginBottom: 8, fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
          0G Autonomous Agents · ERC-7857 iNFT
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: 42,
            fontWeight: 500,
            letterSpacing: "-0.02em",
          }}
        >
          LP Doctor/01
        </h1>
        <p style={{ marginTop: 12, color: "var(--text-secondary)", maxWidth: 720, fontSize: 14, lineHeight: 1.6 }}>
          Autonomous diagnostic agent for Uniswap liquidity positions. Owns a
          persistent on-chain memory DAG on 0G Storage, bills callers per
          24-hour license window in OG via on-chain <code>mintLicense</code>,
          and is invokable by any MCP-compatible client.
        </p>

        {error && (
          <div
            style={{
              marginTop: 24,
              padding: 14,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "rgba(255, 80, 80, 0.06)",
              color: "var(--bleed)",
              fontSize: 12,
              fontFamily: "var(--font-mono)",
            }}
          >
            ⚠ live read failed: {error}
          </div>
        )}

        {/* Live state — three counters from agents(tokenId) */}
        <section
          style={{
            marginTop: 32,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <Stat
            label="Diagnoses anchored"
            value={data ? data.reputation.toString() : loading ? "…" : "—"}
            sub="reputation counter · +1 per anchored report"
            tone="cyan"
          />
          <Stat
            label="Migrations recorded"
            value={data ? data.migrationsTriggered.toString() : loading ? "…" : "—"}
            sub="migrationsTriggered · +1 per Permit2 sign"
            tone="violet"
          />
          <Stat
            label="License price"
            value={data ? `${(100 - (data.protocolFeeBps ?? 0) / 100).toFixed(0)}% / ${(data.protocolFeeBps ?? 0) / 100}%` : "—"}
            sub="owner / treasury split"
            tone="green"
          />
          <Stat
            label="Last update"
            value={data ? fmtTimestamp(data.lastUpdatedAt) : "—"}
            sub="block.timestamp on 0G Galileo"
            tone="amber"
          />
        </section>

        {/* Identity card — contract, owner, codeImage */}
        <section
          style={{
            marginTop: 36,
            padding: 24,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 14, fontFamily: "var(--font-display)", color: "var(--cyan)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Identity
          </h2>
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "180px 1fr", gap: "10px 24px", fontSize: 13, fontFamily: "var(--font-mono)", lineHeight: 1.6 }}>
            <span style={{ color: "var(--text-tertiary)" }}>iNFT contract</span>
            <span>
              {data ? (
                <a href={explorerAddress(data.contract)} target="_blank" rel="noreferrer" style={{ color: "var(--cyan)" }}>
                  {data.contract}
                </a>
              ) : "—"}
            </span>
            <span style={{ color: "var(--text-tertiary)" }}>tokenId</span>
            <span>{data?.tokenId ?? "—"}</span>
            <span style={{ color: "var(--text-tertiary)" }}>owner</span>
            <span>
              {data ? (
                <a href={explorerAddress(data.owner)} target="_blank" rel="noreferrer" style={{ color: "var(--cyan)" }}>
                  {data.owner}
                </a>
              ) : "—"}
            </span>
            <span style={{ color: "var(--text-tertiary)" }}>codeImageHash</span>
            <span title={data?.codeImageHash ?? ""}>{shortHex(data?.codeImageHash ?? "")}</span>
            <span style={{ color: "var(--text-tertiary)" }}>memoryRoot</span>
            <span title={data?.memoryRoot ?? ""}>
              {data?.memoryRoot && data.memoryRoot !== "0x0000000000000000000000000000000000000000000000000000000000000000"
                ? shortHex(data.memoryRoot)
                : "0x0 (no diagnosis anchored yet)"}
            </span>
            <span style={{ color: "var(--text-tertiary)" }}>minted</span>
            <span>{data ? fmtTimestamp(data.mintedAt) : "—"}</span>
          </div>
        </section>

        {/* License section */}
        <section
          style={{
            marginTop: 24,
            padding: 24,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 14, fontFamily: "var(--font-display)", color: "var(--violet)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            License terms
          </h2>
          <p style={{ marginTop: 12, color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.6, maxWidth: 760 }}>
            Other agents call <code>mintLicense(tokenId, licensee, expiresAt) payable</code> on
            the iNFT contract to receive a time-bounded right to invoke{" "}
            <code>lpdoctor.diagnose</code> / <code>preflight</code> /{" "}
            <code>migrate</code> on the MCP server. The verify endpoints stay
            free.
          </p>
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "180px 1fr", gap: "10px 24px", fontSize: 13, fontFamily: "var(--font-mono)", lineHeight: 1.6 }}>
            <span style={{ color: "var(--text-tertiary)" }}>price</span>
            <span>0.1 OG · 24 h window (configurable)</span>
            <span style={{ color: "var(--text-tertiary)" }}>royalty split</span>
            <span>
              {data
                ? `${(100 - data.protocolFeeBps / 100).toFixed(0)} % owner / ${(data.protocolFeeBps / 100).toFixed(0)} % treasury`
                : "—"}
            </span>
            <span style={{ color: "var(--text-tertiary)" }}>treasury</span>
            <span>
              {data ? (
                <a href={explorerAddress(data.protocolTreasury)} target="_blank" rel="noreferrer" style={{ color: "var(--cyan)" }}>
                  {data.protocolTreasury}
                </a>
              ) : "—"}
            </span>
            <span style={{ color: "var(--text-tertiary)" }}>roadmap</span>
            <span style={{ color: "var(--text-secondary)" }}>x402 USDC settlement</span>
          </div>
        </section>

        {/* Verify yourself — cast commands */}
        <section
          style={{
            marginTop: 24,
            padding: 24,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 14, fontFamily: "var(--font-display)", color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Verify the live state yourself
          </h2>
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--text-secondary)", maxWidth: 760, lineHeight: 1.6 }}>
            No LP Doctor server in the trust path. Run <code>cast call</code> against 0G Galileo:
          </p>
          <pre
            style={{
              marginTop: 12,
              padding: 14,
              borderRadius: 8,
              background: "var(--surface-raised)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              overflow: "auto",
              lineHeight: 1.6,
            }}
          >
{`cast call ${data?.contract ?? "<LPDoctorAgent>"} \\
  "agents(uint256)(address,bytes32,bytes32,uint64,uint64,uint64,uint64,string)" \\
  ${data?.tokenId ?? "1"} \\
  --rpc-url https://evmrpc-testnet.0g.ai

# Returns: owner, memoryRoot, codeImageHash, mintedAt, lastUpdatedAt,
#          reputation, migrationsTriggered, metadataUri`}
          </pre>
        </section>
      </main>
    </div>
  );
}

interface StatProps {
  label: string;
  value: string;
  sub: string;
  tone: "cyan" | "violet" | "green" | "amber";
}

const TONE_VAR: Record<StatProps["tone"], string> = {
  cyan: "var(--cyan)",
  violet: "var(--violet, #b48cff)",
  green: "var(--green, #8ee887)",
  amber: "var(--amber, #ffb454)",
};

function Stat({ label, value, sub, tone }: StatProps) {
  return (
    <div
      style={{
        padding: 18,
        borderRadius: 10,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        borderLeft: `3px solid ${TONE_VAR[tone]}`,
      }}
    >
      <div style={{ fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
        {label}
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: "var(--font-display)",
          fontSize: 26,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: TONE_VAR[tone],
          wordBreak: "break-all",
        }}
      >
        {value}
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
        {sub}
      </div>
    </div>
  );
}
