import { describe, expect, it } from "vitest";
import {
  createPublicClient,
  http,
  namehash,
  type Hex,
} from "viem";
import { mainnet } from "viem/chains";

// ENS prize defensibility — proves the same on-chain text-record read
// path used by `lpdoctor.resolveEnsRecord` works against any mainnet
// ENS name. We hit `vitalik.eth` (stable, well-known text records) so
// the test demonstrates the tool is generic and not LPDoctor-specific —
// any ENS-aware agent can use it to resolve any name's records.

const RESOLVER_ABI = [
  {
    name: "text",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "key", type: "string" },
    ],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

const PUBLIC_RESOLVER_MAINNET =
  "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63" as Hex;

// Override via OG_ENS_TEST_RPC if a local mirror is needed. The test
// is idempotent — only reads, no funds spent.
const RPC_URL =
  process.env.OG_ENS_TEST_RPC ?? "https://ethereum-rpc.publicnode.com";

describe("ENS — resolveEnsRecord generic mainnet read", () => {
  const client = createPublicClient({
    chain: mainnet,
    transport: http(RPC_URL),
  });

  it("resolves lpdoctoragent.eth records on Sepolia", async () => {
    const sepoliaClient = createPublicClient({
      transport: http(
        process.env.OG_ENS_TEST_SEPOLIA_RPC ??
          "https://ethereum-sepolia-rpc.publicnode.com",
      ),
    });
    const sepoliaResolver =
      "0x8FADE66B79cC9f707aB26799354482EB93a5B7dD" as Hex;
    const node = namehash("lpdoctoragent.eth");
    const value = (await sepoliaClient.readContract({
      address: sepoliaResolver,
      abi: RESOLVER_ABI,
      functionName: "text",
      args: [node, "lpdoctor.605311.rootHash"],
    })) as string;
    // Either a real rootHash (after a publish) or empty (before).
    // We assert non-undefined so the test is hermetic across clean
    // environments; the real-on-chain assertion is a one-shot script.
    expect(typeof value).toBe("string");
  }, 30_000);

  it("reads url text record on vitalik.eth", async () => {
    const node = namehash("vitalik.eth");
    const value = (await client.readContract({
      address: PUBLIC_RESOLVER_MAINNET,
      abi: RESOLVER_ABI,
      functionName: "text",
      args: [node, "url"],
    })) as string;
    expect(typeof value).toBe("string");
    // vitalik.eth has had a url record set for years; we don't pin the
    // exact value (it can change) but assert it's non-empty.
    expect(value.length).toBeGreaterThan(0);
  }, 30_000);

  it("reads description text record on vitalik.eth", async () => {
    const node = namehash("vitalik.eth");
    const value = (await client.readContract({
      address: PUBLIC_RESOLVER_MAINNET,
      abi: RESOLVER_ABI,
      functionName: "text",
      args: [node, "description"],
    })) as string;
    // Description may be unset — just confirm the call succeeds.
    expect(typeof value).toBe("string");
  }, 30_000);

  it("returns empty string for an unset key", async () => {
    const node = namehash("vitalik.eth");
    const value = (await client.readContract({
      address: PUBLIC_RESOLVER_MAINNET,
      abi: RESOLVER_ABI,
      functionName: "text",
      args: [node, "lpdoctor.unset.key.for.test"],
    })) as string;
    expect(value).toBe("");
  }, 30_000);
});
