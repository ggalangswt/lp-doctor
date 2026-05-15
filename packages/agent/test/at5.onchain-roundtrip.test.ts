import { describe, expect, it } from "vitest";
import { createPublicClient, defineChain, http, type Hex } from "viem";

// AT-5 — On-chain anchor round-trip.
// Verifies that a previously-anchored report's metadata can be read
// back from the LPDoctorReports registry on 0G Galileo from a process
// that does NOT trust the LPDoctor server. This is the test that
// underwrites the demo's "composability" beat: any agent with the
// rootHash + the contract address + an RPC URL can independently
// confirm publisher, tokenId, and timestamp without going through the
// LPDoctor API.
//
// Skipped unless `LPDOCTOR_AT5_ROOTHASH` is set in the environment, since
// the test pins on a specific anchored report. Run after a fresh
// diagnose with all 0G keys configured:
//
//   LPDOCTOR_AT5_ROOTHASH=0x... \
//   LPDOCTOR_AT5_TOKENID=1 \
//   LPDOCTOR_AT5_PUBLISHER=0x95eEe5... \
//   pnpm --filter @lpdoctor/agent test at5.onchain
//
// All four env vars must be set together.

const LPDOCTOR_REPORTS_CONTRACT =
  (process.env.LPDOCTOR_REPORTS_CONTRACT as Hex | undefined) ??
  ("0x3b733eC427eeA5C379Bbd0CF50Dc0b931C5E00d3" as Hex);

const RPC_URL =
  process.env.OG_GALILEO_RPC ?? "https://evmrpc-testnet.0g.ai";

const ROOT_HASH = process.env.LPDOCTOR_AT5_ROOTHASH as Hex | undefined;
const EXPECTED_TOKEN_ID = process.env.LPDOCTOR_AT5_TOKENID;
const EXPECTED_PUBLISHER = process.env.LPDOCTOR_AT5_PUBLISHER as
  | Hex
  | undefined;

const og0Galileo = defineChain({
  id: 16602,
  name: "0G Galileo Testnet",
  nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
});

const REPORTS_ABI = [
  {
    name: "reports",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "rootHash", type: "bytes32" }],
    outputs: [
      { name: "publisher", type: "address" },
      { name: "timestamp", type: "uint64" },
      { name: "tokenId", type: "uint256" },
      { name: "rootHash", type: "bytes32" },
      { name: "attestation", type: "bytes" },
    ],
  },
  {
    name: "reportCount",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

describe.skipIf(!ROOT_HASH || !EXPECTED_TOKEN_ID || !EXPECTED_PUBLISHER)(
  "AT-5 — on-chain anchor round-trip",
  () => {
    const client = createPublicClient({
      chain: og0Galileo,
      transport: http(RPC_URL),
    });

    it("registry returns the anchored report metadata", async () => {
      const result = (await client.readContract({
        address: LPDOCTOR_REPORTS_CONTRACT,
        abi: REPORTS_ABI,
        functionName: "reports",
        args: [ROOT_HASH!],
      })) as readonly [Hex, bigint, bigint, Hex, Hex];

      const [publisher, timestamp, tokenId, returnedRoot] = result;
      expect(publisher.toLowerCase()).toBe(EXPECTED_PUBLISHER!.toLowerCase());
      expect(tokenId.toString()).toBe(EXPECTED_TOKEN_ID);
      expect(returnedRoot.toLowerCase()).toBe(ROOT_HASH!.toLowerCase());
      expect(timestamp).toBeGreaterThan(0n);
    });

    it("reportCount(tokenId) is at least 1", async () => {
      const count = (await client.readContract({
        address: LPDOCTOR_REPORTS_CONTRACT,
        abi: REPORTS_ABI,
        functionName: "reportCount",
        args: [BigInt(EXPECTED_TOKEN_ID!)],
      })) as bigint;

      expect(count).toBeGreaterThanOrEqual(1n);
    });
  },
);

describe("AT-5 — registry contract reachable", () => {
  it("reportCount(<arbitrary>) returns a uint", async () => {
    const client = createPublicClient({
      chain: og0Galileo,
      transport: http(RPC_URL),
    });

    const count = (await client.readContract({
      address: LPDOCTOR_REPORTS_CONTRACT,
      abi: REPORTS_ABI,
      functionName: "reportCount",
      args: [999_999n],
    })) as bigint;

    // Either 0 (no reports anchored under that tokenId) or some number.
    expect(typeof count).toBe("bigint");
    expect(count).toBeGreaterThanOrEqual(0n);
  });
});
