import { useEffect, useState } from "react";
import {
  createPublicClient,
  defineChain,
  http,
  type Address,
  type Hex,
} from "viem";

// Reads the live state of the LPDoctorAgent iNFT — owner, memoryRoot,
// reputation, migrationsTriggered, license treasury + fee bps. Polls
// every 30 s so the agent profile page reflects on-chain truth, not
// a screenshot. No-op (returns null) when the contract address isn't
// configured at build time.

// Defaults match the live deployment on 0G Newton — env overrides win
// when a redeploy points the page at a fresh contract.
const DEFAULT_AGENT_CONTRACT =
  "0x938f3B7841b3faCbBE967F90B548d991e9882c6C" as Address;
const AGENT_ADDRESS = (import.meta.env.VITE_LPDOCTOR_AGENT_CONTRACT ??
  import.meta.env.VITE_LPLENS_AGENT_CONTRACT ??
  DEFAULT_AGENT_CONTRACT) as Address;
const AGENT_TOKEN_ID = BigInt(
  (import.meta.env.VITE_LPDOCTOR_AGENT_TOKEN_ID as string | undefined) ??
    (import.meta.env.VITE_LPLENS_AGENT_TOKEN_ID as string | undefined) ??
    "1",
);
const NEWTON_RPC =
  (import.meta.env.VITE_OG_NEWTON_RPC as string | undefined) ??
  "https://evmrpc-testnet.0g.ai";
const NEWTON_CHAIN_ID = Number(
  (import.meta.env.VITE_OG_CHAIN_ID as string | undefined) ?? "16602",
);

const ABI = [
  {
    name: "agents",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      { name: "owner", type: "address" },
      { name: "memoryRoot", type: "bytes32" },
      { name: "codeImageHash", type: "bytes32" },
      { name: "mintedAt", type: "uint64" },
      { name: "lastUpdatedAt", type: "uint64" },
      { name: "reputation", type: "uint64" },
      { name: "migrationsTriggered", type: "uint64" },
      { name: "metadataUri", type: "string" },
    ],
  },
  {
    name: "protocolTreasury",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "protocolFeeBps",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint16" }],
  },
] as const;

const newtonChain = defineChain({
  id: NEWTON_CHAIN_ID,
  name: "0G Newton Testnet",
  nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
  rpcUrls: { default: { http: [NEWTON_RPC] } },
});

export interface AgentLiveState {
  contract: Address;
  tokenId: string;
  owner: Address;
  memoryRoot: Hex;
  codeImageHash: Hex;
  mintedAt: number;
  lastUpdatedAt: number;
  reputation: number;
  migrationsTriggered: number;
  metadataUri: string;
  protocolTreasury: Address;
  protocolFeeBps: number;
  fetchedAt: number;
}

export interface AgentLiveStateResult {
  data: AgentLiveState | null;
  loading: boolean;
  error: string | null;
}

const POLL_INTERVAL_MS = 30_000;

export function useAgentLiveState(): AgentLiveStateResult {
  const [data, setData] = useState<AgentLiveState | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const client = createPublicClient({
      chain: newtonChain,
      transport: http(),
    });

    const refresh = async () => {
      try {
        setLoading(true);
        const [agent, treasury, feeBps] = await Promise.all([
          client.readContract({
            address: AGENT_ADDRESS as Address,
            abi: ABI,
            functionName: "agents",
            args: [AGENT_TOKEN_ID],
          }) as Promise<
            readonly [Address, Hex, Hex, bigint, bigint, bigint, bigint, string]
          >,
          client.readContract({
            address: AGENT_ADDRESS as Address,
            abi: ABI,
            functionName: "protocolTreasury",
          }) as Promise<Address>,
          client.readContract({
            address: AGENT_ADDRESS as Address,
            abi: ABI,
            functionName: "protocolFeeBps",
          }) as Promise<number>,
        ]);
        if (cancelled) return;
        setData({
          contract: AGENT_ADDRESS as Address,
          tokenId: AGENT_TOKEN_ID.toString(),
          owner: agent[0],
          memoryRoot: agent[1],
          codeImageHash: agent[2],
          mintedAt: Number(agent[3]),
          lastUpdatedAt: Number(agent[4]),
          reputation: Number(agent[5]),
          migrationsTriggered: Number(agent[6]),
          metadataUri: agent[7],
          protocolTreasury: treasury,
          protocolFeeBps: Number(feeBps),
          fetchedAt: Date.now(),
        });
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    refresh();
    const t = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  return { data, loading, error };
}
