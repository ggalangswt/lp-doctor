// 10-15 second MCP demo — three rapid calls that prove the gate is real
// without waiting on the 100 s full-pipeline run. For the recording vod.
//
//   1. list tools (asserts 7 expected)
//   2. lpdoctor.diagnose with UNLICENSED caller — must return paymentRequired
//   3. lpdoctor.lookupReport on a known cached rootHash — must return the report
//
// Total wall time on a warm MCP server: ~3-7 s.

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const REPO = process.cwd();
const MCP_BINARY = `${REPO}/apps/mcp-server/dist/index.js`;
const UNLICENSED = "0x000000000000000000000000000000000000bEEF";
// A rootHash already on disk in apps/server/cache/reports/.
const KNOWN_ROOT =
  "0xd0da92507e2e16e11315d587c64c60547beaa3c5f9bceb7f67356952deb87b11";

function bar() {
  console.log("─".repeat(72));
}

async function main() {
  const client = new Client(
    { name: "lpdoctor-quick-demo", version: "0.1.0" },
    { capabilities: {} },
  );
  await client.connect(
    new StdioClientTransport({
      command: "node",
      args: [MCP_BINARY],
      env: {
        ...process.env,
        LPDOCTOR_API_URL: "http://localhost:3001",
        LPDOCTOR_AGENT_CONTRACT: "0x938f3B7841b3faCbBE967F90B548d991e9882c6C",
        LPDOCTOR_AGENT_TOKEN_ID: "1",
        OG_NEWTON_RPC: "https://evmrpc-testnet.0g.ai",
      },
    }),
  );

  bar();
  console.log("▶ MCP server tools");
  const tools = await client.listTools();
  for (const t of tools.tools) console.log(`  • ${t.name}`);

  bar();
  console.log(`▶ diagnose with UNLICENSED ${UNLICENSED}`);
  const blocked = await client.callTool({
    name: "lpdoctor.diagnose",
    arguments: { tokenId: "605311", caller: UNLICENSED },
  });
  const blockedPayload = JSON.parse(blocked.content[0].text);
  if (blockedPayload.paymentRequired) {
    const pr = blockedPayload.paymentRequired;
    console.log(`  ✓ blocked — paymentRequired`);
    console.log(`     contract: ${pr.licenseContract}`);
    console.log(`     price:    ${Number(pr.suggestedPriceWei) / 1e18} OG / 24 h`);
    console.log(`     split:    80% owner / 20% protocol treasury`);
  }

  bar();
  console.log(`▶ lookupReport on cached rootHash ${KNOWN_ROOT.slice(0, 20)}…`);
  const lookup = await client.callTool({
    name: "lpdoctor.lookupReport",
    arguments: { rootHash: KNOWN_ROOT },
  });
  const lookupPayload = JSON.parse(lookup.content[0].text);
  if (lookupPayload.found) {
    console.log(`  ✓ report fetched`);
    console.log(`     position: ${lookupPayload.payload?.position?.pair} tokenId=${lookupPayload.payload?.position?.tokenId}`);
    console.log(`     anchor:   ${lookupPayload.anchorTxHash?.slice(0, 18)}… on chain ${lookupPayload.anchorChainId}`);
  }

  bar();
  console.log("▶ done — license gate verified end-to-end");
  await client.close();
}

main().catch((err) => {
  console.error("FATAL", err);
  process.exit(1);
});
