// Read-only viem client used by the MCP layer to check on-chain
// state of the LPDoctorAgent iNFT — owner address and per-caller
// license status. The MCP server never signs anything; it only
// gates tool calls based on what the iNFT contract reports.

import {
  createPublicClient,
  defineChain,
  http,
  type Address,
} from "viem";

const DEFAULT_RPC = "https://evmrpc.0g.ai";
const DEFAULT_CHAIN_ID = 16661;

const LPDOCTOR_AGENT_READ_ABI = [
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
    name: "isLicensed",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "caller", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export interface OnchainConfig {
  contract: Address | undefined;
  rpcUrl: string;
  chainId: number;
}

export class OnchainClient {
  private readonly cfg: OnchainConfig;

  constructor(cfg?: Partial<OnchainConfig>) {
    this.cfg = {
      contract: (cfg?.contract ?? process.env.LPDOCTOR_AGENT_CONTRACT) as
        | Address
        | undefined,
      rpcUrl: cfg?.rpcUrl ?? process.env.OG_GALILEO_RPC ?? DEFAULT_RPC,
      chainId: cfg?.chainId ?? DEFAULT_CHAIN_ID,
    };
  }

  isConfigured(): boolean {
    return Boolean(this.cfg.contract);
  }

  async isLicensed(tokenId: bigint, caller: Address): Promise<boolean> {
    if (!this.cfg.contract) return true; // open mode when contract not set
    const client = this.publicClient();
    return (await client.readContract({
      address: this.cfg.contract,
      abi: LPDOCTOR_AGENT_READ_ABI,
      functionName: "isLicensed",
      args: [tokenId, caller],
    })) as boolean;
  }

  async getOwner(tokenId: bigint): Promise<Address | null> {
    if (!this.cfg.contract) return null;
    const client = this.publicClient();
    const tuple = (await client.readContract({
      address: this.cfg.contract,
      abi: LPDOCTOR_AGENT_READ_ABI,
      functionName: "agents",
      args: [tokenId],
    })) as readonly [Address, ...unknown[]];
    return tuple[0] === "0x0000000000000000000000000000000000000000"
      ? null
      : tuple[0];
  }

  contractAddress(): Address | undefined {
    return this.cfg.contract;
  }

  chainId(): number {
    return this.cfg.chainId;
  }

  private publicClient() {
    const chain = defineChain({
      id: this.cfg.chainId,
      name: "0G Mainnet",
      nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
      rpcUrls: { default: { http: [this.cfg.rpcUrl] } },
    });
    return createPublicClient({ chain, transport: http() });
  }
}

let cached: OnchainClient | null = null;
export function onchain(): OnchainClient {
  if (!cached) cached = new OnchainClient();
  return cached;
}
