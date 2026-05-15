// LP Doctor MCP smoke test — spawns the MCP server via STDIO and exercises
// the licensing gate end-to-end. Uses the licensed Anvil-#1 address that
// already has a 24 h licence on the deployed iNFT, plus a random
// unlicensed address to prove the paymentRequired path fires.

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const REPO = process.cwd();
const MCP_BINARY = `${REPO}/apps/mcp-server/dist/index.js`;

const LICENSED_CALLER = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // anvil #1 — bought 0.1 OG licence on May 4
const UNLICENSED_CALLER = "0x000000000000000000000000000000000000bEEF";

// Real Uniswap V3 LP NFT — bleeding wallet's USDC/WETH 0.05 % position.
const TEST_TOKEN_ID = "605311";

function logSection(title) {
  console.log("\n" + "═".repeat(76));
  console.log(`▶ ${title}`);
  console.log("═".repeat(76));
}

function preview(json) {
  const text = typeof json === "string" ? json : JSON.stringify(json, null, 2);
  return text.length > 800 ? text.slice(0, 800) + "\n…[truncated]" : text;
}

async function main() {
  logSection("1. spawning MCP server via STDIO");
  const client = new Client(
    { name: "lpdoctor-mcp-smoke", version: "0.1.0" },
    { capabilities: {} },
  );
  const transport = new StdioClientTransport({
    command: "node",
    args: [MCP_BINARY],
    env: {
      ...process.env,
      LPDOCTOR_API_URL: "http://localhost:3001",
      LPDOCTOR_AGENT_CONTRACT: "0x938f3B7841b3faCbBE967F90B548d991e9882c6C",
      LPDOCTOR_AGENT_TOKEN_ID: "1",
      OG_GALILEO_RPC: "https://evmrpc-testnet.0g.ai",
    },
  });
  await client.connect(transport);
  console.log("✓ connected");

  logSection("2. listing tools — confirming the MCP advertises the 6 expected");
  const tools = await client.listTools();
  for (const t of tools.tools) {
    console.log(`  • ${t.name}`);
  }
  const expected = [
    "lpdoctor.ping",
    "lpdoctor.diagnose",
    "lpdoctor.preflight",
    "lpdoctor.migrate",
    "lpdoctor.lookupReport",
    "lpdoctor.resolveEnsRecord",
    "lpdoctor.lookupReportOnChain",
  ];
  const got = tools.tools.map((t) => t.name).sort();
  const missing = expected.filter((e) => !got.includes(e));
  console.log(missing.length === 0 ? "✓ all expected tools present" : `✘ missing: ${missing.join(", ")}`);

  logSection("3. lpdoctor.diagnose with UNLICENSED caller — must return paymentRequired");
  const blocked = await client.callTool({
    name: "lpdoctor.diagnose",
    arguments: {
      tokenId: TEST_TOKEN_ID,
      caller: UNLICENSED_CALLER,
      timeoutMs: 30000,
    },
  });
  const blockedPayload = JSON.parse(blocked.content[0].text);
  if (blockedPayload.paymentRequired) {
    console.log("✓ blocked correctly. paymentRequired =");
    console.log(preview(blockedPayload.paymentRequired));
  } else {
    console.log("✘ expected paymentRequired but got:");
    console.log(preview(blockedPayload));
  }

  logSection("4. lpdoctor.diagnose with LICENSED caller — must stream full pipeline");
  const t0 = Date.now();
  const allowed = await client.callTool(
    {
      name: "lpdoctor.diagnose",
      arguments: {
        tokenId: TEST_TOKEN_ID,
        caller: LICENSED_CALLER,
        timeoutMs: 120000,
      },
    },
    undefined,
    { timeout: 180_000 },
  );
  const allowedPayload = JSON.parse(allowed.content[0].text);
  const dt = Date.now() - t0;
  if (allowedPayload.paymentRequired) {
    console.log("✘ unexpectedly blocked. paymentRequired:");
    console.log(preview(allowedPayload.paymentRequired));
  } else {
    console.log(`✓ ran end-to-end in ${dt} ms`);
    console.log(`  • position: ${allowedPayload.position?.pair} tick ${allowedPayload.position?.tickLower}→${allowedPayload.position?.tickUpper}`);
    if (allowedPayload.il) {
      console.log(`  • IL: ${allowedPayload.il.ilT1.toFixed(2)} (${allowedPayload.il.ilPct.toFixed(3)}%)`);
    }
    if (allowedPayload.regime) {
      console.log(`  • regime: ${allowedPayload.regime.topLabel} (confidence ${(allowedPayload.regime.confidence * 100).toFixed(0)}%)`);
    }
    if (allowedPayload.hooks) {
      console.log(`  • hooks: ${allowedPayload.hooks.count} candidates, top family ${allowedPayload.hooks.topFamily}`);
    }
    if (allowedPayload.provenance) {
      console.log(`  • rootHash: ${allowedPayload.provenance.rootHash}`);
    }
    if (allowedPayload.anchor) {
      console.log(`  • anchor tx: ${allowedPayload.anchor.txHash} (chain ${allowedPayload.anchor.chainId}, stub=${allowedPayload.anchor.stub})`);
    }
    if (allowedPayload.verdict) {
      console.log(`  • verdict model: ${allowedPayload.verdict.model}`);
      console.log(`  • verdict: ${allowedPayload.verdict.markdown.slice(0, 200)}…`);
    }
    if (allowedPayload.errors?.length) {
      console.log(`  ! errors: ${allowedPayload.errors.join(" | ")}`);
    }
  }

  logSection("5. lpdoctor.lookupReport — verify the just-anchored rootHash is fetchable");
  if (allowedPayload.provenance?.rootHash) {
    const lookup = await client.callTool({
      name: "lpdoctor.lookupReport",
      arguments: { rootHash: allowedPayload.provenance.rootHash },
    });
    const lookupPayload = JSON.parse(lookup.content[0].text);
    if (lookupPayload.found && lookupPayload.rootHash) {
      console.log(`✓ report fetched. cachedAt = ${lookupPayload.cachedAt}`);
      console.log(`  position: ${lookupPayload.payload?.position?.pair} tokenId=${lookupPayload.payload?.position?.tokenId}`);
    } else {
      console.log("✘ report not found:");
      console.log(preview(lookupPayload));
    }
  } else {
    console.log("(skipped — no rootHash from previous step)");
  }

  await client.close();
  logSection("done — MCP licensing gate is functional end-to-end");
}

main().catch((err) => {
  console.error("FATAL", err);
  process.exit(1);
});
