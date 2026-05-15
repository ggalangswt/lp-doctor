import { useState, type ReactNode } from "react";
import { AppHeader } from "../components/AppHeader.js";
import { Chip } from "../design/atoms.js";

// /roadmap — public follow-ups beyond v0.11. Each item is an
// accordion: a one-line claim collapsed, full reasoning + impacted
// surfaces expanded. Items are ordered by leverage, not by ETA.
// Adding a new item = appending to the ROADMAP array.

interface RoadmapItem {
  id: string;
  title: string;
  status: "planned" | "researching" | "scoped";
  effortHours: string;
  oneLine: string;
  body: ReactNode;
}

const STATUS_TONE: Record<RoadmapItem["status"], "cyan" | "violet" | "toxic"> = {
  planned: "cyan",
  researching: "violet",
  scoped: "toxic",
};

const STATUS_LABEL: Record<RoadmapItem["status"], string> = {
  planned: "PLANNED",
  researching: "RESEARCHING",
  scoped: "SCOPED",
};

const ROADMAP: RoadmapItem[] = [
  {
    id: "hosted-mcp",
    title: "Hosted MCP at <YOUR_MCP_URL_OR_STATUS> (HTTP/SSE transport)",
    status: "scoped",
    effortHours: "~6–8 h",
    oneLine:
      "Today users clone the repo and run the MCP server locally as a STDIO subprocess. Ship a public HTTP/SSE-transport MCP under your chosen domain/path so they only need to drop a URL into Claude Desktop config — zero install, zero build.",
    body: (
      <>
        <p>
          The MCP SDK supports SSE-over-HTTP transport. Wrap the existing tool
          handlers in an Express endpoint mounted at <code>/mcp</code> on the
          same backend that already serves the REST API. The internal Caddy
          adds a <code>handle /mcp/*</code> block alongside the existing{" "}
          <code>/api/*</code> route. No new subdomain, no new TLS cert.
        </p>
        <h4>What changes for users</h4>
        <ul>
          <li>
            <strong>From</strong>{" "}
            <code>"command": "node", "args": ["/abs/path/dist/index.js"]</code>
          </li>
          <li>
            <strong>To</strong> <code>"url": "&lt;YOUR_MCP_URL_OR_STATUS&gt;"</code>
          </li>
        </ul>
        <p>
          The local STDIO path stays available for users who want full control
          (and who don't trust an external MCP). Licence gating + pricing
          stay identical — gated tools still check <code>isLicensed</code>{" "}
          on-chain regardless of transport.
        </p>
      </>
    ),
  },
  {
    id: "npm-package",
    title: "Publish @lpdoctor/mcp-server on npm",
    status: "planned",
    effortHours: "~3 h",
    oneLine:
      "Cut a release of the MCP server as a globally-installable npm package so users can run lpdoctor-mcp from any shell without cloning the monorepo.",
    body: (
      <>
        <p>
          Extract <code>apps/mcp-server</code> into its own package.json, bundle the
          runtime dependencies, register a <code>bin</code> entry. CI publishes
          automatically on tags prefixed <code>mcp-v</code>.
        </p>
      </>
    ),
  },
  {
    id: "v4-execute",
    title: "Real V4 migration execution (not sign-only)",
    status: "researching",
    effortHours: "~12–15 h",
    oneLine:
      "Today the user signs the Permit2 bundle and the agent stops there. Wire an optional Universal Router execution path so a click-to-migrate completes end-to-end on chain — still custodial-free, still single-sig.",
    body: (
      <>
        <p>
          Custody stays user-side: the signed Permit2 PermitSingle authorises{" "}
          <code>spender = Universal Router</code> for a one-time spend. The
          agent submits the multicall (close V3 → swap → mint V4) on behalf of
          the user without ever holding their tokens.
        </p>
        <h4>Why it's not in v0.11</h4>
        <p>
          Mainnet V4 has very thin liquidity outside USDC/WETH 0.05% — testing
          a real migration end-to-end requires either (a) waiting for V4
          adoption to reach a meaningful set of pairs, or (b) shipping on Base
          where V4 + hooks have stronger early traction. Pairs with the chain
          rollout above.
        </p>
      </>
    ),
  },
  {
    id: "x402-usdc",
    title: "x402 USDC settlement for licence payments",
    status: "scoped",
    effortHours: "~4 h",
    oneLine:
      "Today mintLicense pays in OG (the 0G Galileo native token). Add an HTTP-402 endpoint so callers can settle in USDC via x402 instead — currency-agnostic at the source-of-funds level.",
    body: (
      <>
        <p>
          The contract's royalty split logic is currency-agnostic — only the
          settlement layer needs work. Wire the agent's MCP server to advertise
          a <code>402 Payment Required</code> response when a caller hits a
          gated tool, with x402 metadata pointing at a USDC payment endpoint
          that mints the on-chain licence on receipt.
        </p>
      </>
    ),
  },
  {
    id: "drift-webhooks",
    title: "Drift webhooks — notify when an LP exits range",
    status: "researching",
    effortHours: "~6 h",
    oneLine:
      "Subscribe to a wallet + position. The agent polls regime + range state every N minutes; when a position drifts past 85% of range or exits, fire a webhook to the user's Telegram / Discord / email.",
    body: (
      <>
        <p>
          Server-side BullMQ schedule per subscription, hits the same diagnose
          pipeline that runs on demand today (just truncated — phase 1 + 4
          only, no LLM call). Notification payload includes a one-line summary
          and a deep link to <code>/diagnose/&lt;tokenId&gt;</code>.
        </p>
      </>
    ),
  },
  {
    id: "inft-marketplace",
    title: "iNFT transfer + agent strategy marketplace",
    status: "researching",
    effortHours: "~10 h",
    oneLine:
      "transferAgent already exists on the iNFT contract. Build a marketplace where reputable agents (high reputation + high migrationsTriggered) can be listed and bought — buyer takes ownership of the on-chain identity + memoryRoot history.",
    body: (
      <>
        <p>
          The buyer inherits the agent's full track record on chain — every
          diagnose anchored, every migration recorded. Royalty split (80/20)
          stays in effect on future <code>mintLicense</code> calls under the
          new owner.
        </p>
        <p>
          Listings + bids handled off-chain via signed orders settled in a
          single atomic <code>transferAgent</code> + payment transaction.
        </p>
      </>
    ),
  },
  {
    id: "multi-chain",
    title: "Multi-chain expansion across every Uniswap L1 / L2",
    status: "scoped",
    effortHours: "~10–12 h",
    oneLine:
      "v0.11 reads only Ethereum mainnet (chainId 1). Extend the data plane to every chain where Uniswap V3 or V4 is deployed — Arbitrum, Base, Optimism, Polygon, BNB Chain, Avalanche, Blast, Zora, Worldchain, Unichain, Soneium, Ink, Lens, Celo, zkSync, Saga, and the testnets.",
    body: (
      <>
        <p>
          The Permit2 EIP-712 builder already accepts an arbitrary{" "}
          <code>chainId</code>, so the migration leg is chain-portable today —
          what is missing is the upstream data plane.
        </p>
        <h4>Layers to extend</h4>
        <ul>
          <li>
            <strong>Subgraph registry.</strong> Replace the two hard-coded
            mainnet subgraph IDs in{" "}
            <code>apps/server/src/services/subgraph.ts</code> with a per-chain
            map. Uniswap maintains public V3 + V4 subgraph IDs on The Graph
            Network for every supported chain — Arbitrum, Base, Optimism,
            Polygon, BNB, Avalanche, Blast, Zora, Worldchain, Unichain,
            Soneium, Ink, Lens, Celo, zkSync, Saga. Catalogue once,
            parameterise <code>buildV3Endpoint(chainId)</code> /{" "}
            <code>buildV4Endpoint(chainId)</code>.
          </li>
          <li>
            <strong>RPC + contract addresses.</strong> Per-chain RPC env vars
            (<code>BASE_RPC</code>, <code>ARBITRUM_RPC</code>,{" "}
            <code>UNICHAIN_RPC</code>, …) and a viem client factory{" "}
            <code>getClient(chainId)</code>. Permit2 is deterministic
            CREATE2 (<code>0x000000000022D473030F116dDEE9F6B43aC78BA3</code>{" "}
            everywhere) but V4 PoolManager and V4 PositionManager differ per
            chain — explicit mapping required.
          </li>
          <li>
            <strong>Atlas chain selector.</strong> Dropdown beside the wallet
            input in <code>/atlas</code>, persisted in the URL{" "}
            <code>?chain=8453&address=0xabc</code> for permalinks. Auto-pick
            from <code>useAccount()</code> when a wallet is connected.
          </li>
          <li>
            <strong>AT-2 swap-replay corpus per chain.</strong> Phase 6
            anchors the hook scoring on 1 000 mainnet swaps replayed
            swap-by-swap with 0 bps drift vs on-chain state. Each new chain
            requires re-anchoring this on its own RPC + subgraph and
            re-validating the drift target — the riskiest piece of the
            extension.
          </li>
        </ul>
        <h4>Why it's not in v0.11</h4>
        <p>
          Multi-chain itself is straightforward plumbing (~5 h) but the AT-2
          re-validation per chain (~5–7 h) is what we cut to ship the
          Ethereum-only flow with verifiable 0 bps drift end-to-end. The
          documented sequence is: catalog subgraph IDs → wire RPC factory →
          add chain selector → re-run AT-2 against Base + Arbitrum + Unichain
          first (largest TVL after mainnet) → ship.
        </p>
      </>
    ),
  },
];

interface AccordionProps {
  item: RoadmapItem;
  open: boolean;
  onToggle: () => void;
}

function AccordionRow({ item, open, onToggle }: AccordionProps) {
  return (
    <article
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        background: "var(--surface)",
        overflow: "hidden",
        marginBottom: 14,
      }}
    >
      <button
        onClick={onToggle}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 18,
          padding: "20px 22px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          color: "var(--text)",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
              flexWrap: "wrap",
            }}
          >
            <Chip tone={STATUS_TONE[item.status]} mono>
              {STATUS_LABEL[item.status]}
            </Chip>
            <Chip mono>{item.effortHours}</Chip>
          </div>
          <h3
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontSize: 20,
              fontWeight: 500,
              letterSpacing: "-0.01em",
            }}
          >
            {item.title}
          </h3>
          <p
            style={{
              margin: "8px 0 0 0",
              color: "var(--text-secondary)",
              fontSize: 14,
              lineHeight: 1.55,
            }}
          >
            {item.oneLine}
          </p>
        </div>
        <span
          aria-hidden
          style={{
            flexShrink: 0,
            fontFamily: "var(--font-mono)",
            fontSize: 18,
            color: "var(--text-tertiary)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 180ms ease",
            marginTop: 4,
          }}
        >
          ⌄
        </span>
      </button>
      {open && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "20px 22px 22px",
            color: "var(--text-secondary)",
            fontSize: 13.5,
            lineHeight: 1.65,
          }}
        >
          {item.body}
        </div>
      )}
    </article>
  );
}

export function Roadmap() {
  const [openId, setOpenId] = useState<string | null>(ROADMAP[0]?.id ?? null);

  return (
    <div>
      <AppHeader />
      <main
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: "48px 36px 80px",
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
          Roadmap · post-submission
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
          What ships next.
        </h1>
        <p
          style={{
            marginTop: 12,
            color: "var(--text-secondary)",
            maxWidth: 720,
            fontSize: 14,
            lineHeight: 1.65,
          }}
        >
          v1.0.3-submission is the audit-grade Ethereum-mainnet build shipped
          to <code>&lt;HACKATHON_OR_SUBMISSION_CONTEXT&gt;</code>. The items below are scoped follow-ups that
          extend reach without touching the verification primitives. Click any
          row to expand the impacted layers and the rationale.
        </p>
        <div style={{ marginTop: 32 }}>
          {ROADMAP.map((item) => (
            <AccordionRow
              key={item.id}
              item={item}
              open={openId === item.id}
              onToggle={() =>
                setOpenId((prev) => (prev === item.id ? null : item.id))
              }
            />
          ))}
        </div>
      </main>
    </div>
  );
}
