import { AppHeader } from "../components/AppHeader.js";

const REPO_BASE = "https://github.com/ggalangswt/lp-doctor";
const SOURCE_ARCHIVE = `${REPO_BASE}/archive/refs/heads/main.zip`;
const MCP_SERVER_URL =
  (import.meta.env.VITE_LPDOCTOR_MCP_URL as string | undefined) ??
  "STDIO (self-host)";
const BACKEND_URL =
  (import.meta.env.VITE_LPDOCTOR_API_URL as string | undefined) ??
  "https://lp-doctor-mainnet.up.railway.app";
const AGENT_CONTRACT =
  (import.meta.env.VITE_LPDOCTOR_AGENT_CONTRACT as string | undefined) ??
  "0xE9446bC93d430e431F204611206B11633aD96F94";
const REPORTS_CONTRACT =
  "0x23Ce8A133B96a0186B8f2cB547553DfF00a3CBd7";
const AGENT_TOKEN_ID =
  (import.meta.env.VITE_LPDOCTOR_AGENT_TOKEN_ID as string | undefined) ??
  "1";
const MAINNET_RPC = "https://evmrpc.0g.ai";

interface ToolRow {
  name: string;
  access: "GATED" | "FREE";
  price: string;
  description: string;
}

const TOOLS: ToolRow[] = [
  {
    name: "lpdoctor.ping",
    access: "FREE",
    price: "FREE",
    description:
      "Transport liveness check. Useful for confirming the MCP server is reachable before invoking product tools.",
  },
  {
    name: "lpdoctor.diagnose",
    access: "GATED",
    price: "0.1 OG / 24 h",
    description:
      "Runs the full LP Doctor pipeline on a tokenId and returns the structured verdict, provenance, and migration context.",
  },
  {
    name: "lpdoctor.preflight",
    access: "GATED",
    price: "0.1 OG / 24 h",
    description:
      "Lightweight health check for a position. Stops before the full verdict to answer whether a deeper diagnosis is warranted.",
  },
  {
    name: "lpdoctor.migrate",
    access: "GATED",
    price: "0.1 OG / 24 h",
    description:
      "Builds the Permit2 migration payload from a diagnosed report. It prepares typed data only and never submits a swap bundle.",
  },
  {
    name: "lpdoctor.lookupReport",
    access: "FREE",
    price: "FREE",
    description:
      "Fetches a persisted report by rootHash from the backend report cache so other agents can inspect a prior diagnosis.",
  },
  {
    name: "lpdoctor.lookupReportOnChain",
    access: "FREE",
    price: "FREE",
    description:
      "Reads LPDoctorReports directly on 0G Aristotle Mainnet to verify that a given rootHash was anchored onchain.",
  },
];

export function Developers() {
  return (
    <div>
      <AppHeader />
      <main
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "48px 36px 64px",
        }}
      >
        <div
          style={{
            marginBottom: 8,
            fontSize: 11,
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
        >
          Agent economy · MCP + mintLicense
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
          Call LP Doctor from any agent.
        </h1>
        <p
          style={{
            marginTop: 12,
            color: "var(--text-secondary)",
            maxWidth: 820,
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          LP Doctor exposes a local Model Context Protocol server so Claude
          Desktop, Cursor, and custom agents can call the same live product
          backend that powers the web app. The current MCP surface includes six
          tools total: a free transport ping, three gated product calls behind
          <code> mintLicense</code>, and two public verification tools. Hosted
          MCP is not live yet; today the supported transport is local STDIO with
          the mainnet backend at <code>{BACKEND_URL}</code>.
        </p>

        <section
          style={{
            marginTop: 28,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          <MetricCard
            title="6 tools total"
            value="1 utility · 3 gated · 2 public"
            desc="The active MCP interface is intentionally small and typed."
          />
          <MetricCard
            title="Mainnet backend"
            value="Aristotle Mainnet + Ethereum reads"
            desc="MCP calls the live backend instead of duplicating pipeline logic."
          />
          <MetricCard
            title="License gate"
            value="0.1 OG / 24 h"
            desc="The iNFT contract enforces access for diagnose, preflight, and migrate."
          />
        </section>

        <section
          style={{
            marginTop: 32,
            padding: 0,
            borderRadius: 10,
            border: "1px solid var(--border)",
            overflow: "hidden",
          }}
        >
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--surface-raised)",
                  textAlign: "left",
                }}
              >
                <th style={th()}>Tool</th>
                <th style={th()}>Access</th>
                <th style={th()}>Price</th>
                <th style={{ ...th(), width: "55%" }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {TOOLS.map((tool) => (
                <tr
                  key={tool.name}
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <td style={td()}>
                    <code style={{ color: "var(--cyan)" }}>{tool.name}</code>
                  </td>
                  <td style={td()}>
                    <span
                      style={{
                        color:
                          tool.access === "GATED"
                            ? "var(--violet, #b48cff)"
                            : "var(--green, #8ee887)",
                      }}
                    >
                      {tool.access}
                    </span>
                  </td>
                  <td style={td()}>
                    <code>{tool.price}</code>
                  </td>
                  <td
                    style={{
                      ...td(),
                      color: "var(--text-secondary)",
                      lineHeight: 1.55,
                    }}
                  >
                    {tool.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section
          style={{
            marginTop: 32,
            padding: 24,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <h2 style={sectionTitle("var(--violet, #b48cff)")}>Mint a license</h2>
          <p style={bodyCopy()}>
            The MCP server checks <code>isLicensed</code> before it will run the
            gated tools. Mint a 24-hour license against tokenId {AGENT_TOKEN_ID}{" "}
            on the live mainnet agent contract, then pass your wallet address as{" "}
            <code>caller</code> when invoking gated tools.
          </p>
          <pre style={codeBlock()}>
{`# 1. mint a 24 h license on 0G Aristotle Mainnet
cast send ${AGENT_CONTRACT} \\
  "mintLicense(uint256,address,uint64)" \\
  ${AGENT_TOKEN_ID} <yourAddress> $(($(date +%s) + 86400)) \\
  --value 0.1ether \\
  --rpc-url ${MAINNET_RPC} \\
  --private-key $YOUR_KEY

# 2. verify the license is active
cast call ${AGENT_CONTRACT} \\
  "isLicensed(uint256,address)(bool)" \\
  ${AGENT_TOKEN_ID} <yourAddress> \\
  --rpc-url ${MAINNET_RPC}
# → true`}
          </pre>
          <p style={helperText()}>
            The contract auto-splits payment between the iNFT owner and protocol
            treasury. The MCP layer only reads license state; it never signs for
            the caller.
          </p>
        </section>

        <section
          style={{
            marginTop: 24,
            padding: 24,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <h2 style={sectionTitle("var(--cyan)")}>
            Run the MCP server locally
          </h2>
          <p style={bodyCopy()}>
            The MCP server is a Node STDIO process. Claude Desktop or any MCP
            client spawns it on your machine; the server then forwards tool
            calls to the live LP Doctor backend and performs the local onchain
            license check using the configured 0G RPC.
          </p>
          <div
            style={{
              marginTop: 16,
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <a
              href={SOURCE_ARCHIVE}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{ padding: "10px 16px", fontSize: 13 }}
            >
              Download source .zip
            </a>
            <a
              href={REPO_BASE}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost"
              style={{ padding: "10px 16px", fontSize: 13 }}
            >
              Open GitHub →
            </a>
          </div>
          <pre style={{ ...codeBlock(), marginTop: 16 }}>
{`git clone ${REPO_BASE}.git LP-Doctor
cd LP-Doctor
pnpm install
pnpm --filter @lpdoctor/mcp-server build
node $(pwd)/apps/mcp-server/dist/index.js`}
          </pre>
          <p style={helperText()}>
            There is no hosted MCP endpoint today. <code>{MCP_SERVER_URL}</code>{" "}
            here means the transport remains local/self-hosted until the
            roadmap’s HTTP/SSE transport lands.
          </p>
        </section>

        <section
          style={{
            marginTop: 24,
            padding: 24,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <h2 style={sectionTitle("var(--cyan)")}>Claude Desktop install</h2>
          <p style={bodyCopy()}>
            Add an MCP server entry that points to the built STDIO binary. The
            environment key name <code>OG_GALILEO_RPC</code> is retained for
            backward compatibility in the current codebase, but its value should
            be your mainnet RPC.
          </p>
          <pre style={codeBlock()}>
{`{
  "mcpServers": {
    "lpdoctor": {
      "command": "node",
      "args": ["/abs/path/to/LP-Doctor/apps/mcp-server/dist/index.js"],
      "env": {
        "LPDOCTOR_API_URL": "${BACKEND_URL}",
        "LPDOCTOR_AGENT_CONTRACT": "${AGENT_CONTRACT}",
        "LPDOCTOR_REPORTS_CONTRACT": "${REPORTS_CONTRACT}",
        "LPDOCTOR_AGENT_TOKEN_ID": "${AGENT_TOKEN_ID}",
        "OG_GALILEO_RPC": "${MAINNET_RPC}"
      }
    }
  }
}`}
          </pre>
        </section>

        <section
          style={{
            marginTop: 24,
            padding: 24,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <h2 style={sectionTitle("var(--green, #8ee887)")}>
            TypeScript client example
          </h2>
          <pre style={codeBlock()}>
{`import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const client = new Client({ name: "your-agent", version: "0.1.0" });
await client.connect(
  new StdioClientTransport({
    command: "node",
    args: ["/abs/path/to/LP-Doctor/apps/mcp-server/dist/index.js"],
  }),
);

const result = await client.callTool({
  name: "lpdoctor.diagnose",
  arguments: {
    tokenId: "605311",
    caller: "0xYourAddress",
  },
});

console.log(result);`}
          </pre>
          <p style={helperText()}>
            If the caller is unlicensed, gated tools return payment metadata
            telling the client which contract and tokenId to use for
            <code>mintLicense</code>.
          </p>
        </section>

        <section
          style={{
            marginTop: 24,
            padding: 24,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <h2 style={sectionTitle("var(--yellow, #ffd24a)")}>
            Trust-minimized verification
          </h2>
          <p style={bodyCopy()}>
            The free verification path is intentionally public. Other agents can
            resolve a cached report by rootHash through <code>lookupReport</code>{" "}
            or bypass the LP Doctor server entirely through{" "}
            <code>lookupReportOnChain</code>, which reads the mainnet
            <code>LPDoctorReports</code> contract directly at{" "}
            <code>{REPORTS_CONTRACT}</code>.
          </p>
        </section>
      </main>
    </div>
  );
}

function MetricCard({
  title,
  value,
  desc,
}: {
  title: string;
  value: string;
  desc: string;
}) {
  return (
    <div
      style={{
        padding: 18,
        borderRadius: 10,
        border: "1px solid var(--border)",
        background: "var(--surface)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 22,
          letterSpacing: "-0.02em",
          marginBottom: 8,
        }}
      >
        {value}
      </div>
      <div style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.55 }}>
        {desc}
      </div>
    </div>
  );
}

function sectionTitle(color: string) {
  return {
    margin: 0,
    fontSize: 14,
    fontFamily: "var(--font-display)",
    color,
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
  };
}

function bodyCopy() {
  return {
    marginTop: 12,
    fontSize: 13,
    color: "var(--text-secondary)",
    maxWidth: 820,
    lineHeight: 1.65,
  };
}

function helperText() {
  return {
    marginTop: 12,
    fontSize: 11,
    color: "var(--text-tertiary)",
    lineHeight: 1.55,
  };
}

function codeBlock() {
  return {
    marginTop: 12,
    padding: 14,
    borderRadius: 8,
    background: "var(--surface-raised)",
    border: "1px solid var(--border)",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    overflow: "auto",
    lineHeight: 1.6,
  };
}

function th() {
  return {
    padding: "12px 16px",
    fontSize: 11,
    color: "var(--text-tertiary)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    fontWeight: 500,
  };
}

function td() {
  return {
    padding: "14px 16px",
    fontSize: 13,
    fontFamily: "var(--font-mono)",
    verticalAlign: "top" as const,
  };
}
