import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  keccak256,
  toHex,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "../config.js";
import { logger } from "../logger.js";

// 0G Chain anchor — preferred path is to call LPDoctorReports.publishReport
// when LPDOCTOR_REPORTS_CONTRACT is configured. That gives us a real
// content-addressed registry on 0G Chain (anyone can read by rootHash).
// Fallback path is a self-tx with the rootHash as calldata, which still
// puts the hash on chain but without the registry indexing. Last fallback
// is a deterministic stub — used when no signing key is set.

const zeroGGalileo = defineChain({
  id: config.OG_CHAIN_ID,
  name: "0G Galileo Testnet",
  nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
  rpcUrls: { default: { http: [config.OG_GALILEO_RPC] } },
});

export interface AnchorReceipt {
  txHash: string;
  blockNumber?: number;
  chainId: number;
  explorerUrl: string;
  contract?: string;
  stub: boolean;
}

const EXPLORER_BASE = "https://chainscan-galileo.0g.ai/tx";

const LPDOCTOR_REPORTS_ABI = [
  {
    name: "publishReport",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "rootHash", type: "bytes32" },
      { name: "attestation", type: "bytes" },
    ],
    outputs: [],
  },
  {
    name: "reports",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "rootHash", type: "bytes32" }],
    outputs: [
      { name: "publisher", type: "address" },
      { name: "timestamp", type: "uint64" },
      { name: "tokenId", type: "uint256" },
      { name: "storedRootHash", type: "bytes32" },
      { name: "attestation", type: "bytes" },
    ],
  },
] as const;

const LPDOCTOR_AGENT_ABI = [
  {
    name: "updateMemoryRoot",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "newRoot", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "recordDiagnose",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "recordMigration",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "permit2Digest", type: "bytes32" },
    ],
    outputs: [],
  },
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
] as const;

export interface AgentMemoryUpdate {
  tokenId: number;
  contract: string;
  memoryRoot: string;
  reputation: number;
  migrationsTriggered?: number;
  updateMemoryTx?: string;
  recordDiagnoseTx?: string;
  stub: boolean;
  warnings: string[];
}

export interface MigrationRecordReceipt {
  tokenId: number;
  contract: string;
  permit2Digest: string;
  migrationsTriggered: number;
  txHash?: string;
  explorerUrl?: string;
  stub: boolean;
  warnings: string[];
}

export class OgChainClient {
  isReady(): boolean {
    return Boolean(config.OG_ANCHOR_PRIVATE_KEY);
  }

  hasContract(): boolean {
    return Boolean(config.LPDOCTOR_REPORTS_CONTRACT);
  }

  async anchor(rootHash: string, tokenId?: string): Promise<AnchorReceipt> {
    if (!config.OG_ANCHOR_PRIVATE_KEY) {
      const stubTx = stubTxHash(rootHash);
      logger.info(
        `0g-chain stub anchor (no signer key) rootHash=${rootHash} stubTx=${stubTx}`,
      );
      return {
        txHash: stubTx,
        chainId: config.OG_CHAIN_ID,
        explorerUrl: `stub://og-chain/${stubTx}`,
        stub: true,
      };
    }

    const account = privateKeyToAccount(
      normalizeHex(config.OG_ANCHOR_PRIVATE_KEY),
    );
    const wallet = createWalletClient({
      account,
      chain: zeroGGalileo,
      transport: http(),
    });
    const publicClient = createPublicClient({
      chain: zeroGGalileo,
      transport: http(),
    });

    let txHash: Hex | undefined;

    try {

      if (config.LPDOCTOR_REPORTS_CONTRACT) {
        // Preferred: call the registry contract.
        txHash = await wallet.writeContract({
          address: config.LPDOCTOR_REPORTS_CONTRACT as Hex,
          abi: LPDOCTOR_REPORTS_ABI,
          functionName: "publishReport",
          args: [
            BigInt(tokenId ?? "0"),
            normalizeHex(rootHash),
            "0x" as Hex,
          ],
        });
      } else {
        // Fallback: self-tx with rootHash as calldata.
        txHash = await wallet.sendTransaction({
          to: account.address,
          value: 0n,
          data: normalizeHex(rootHash),
        });
      }

      // 0G Galileo blocks are fast but RPC propagation can lag. Generous
      // timeout + slow polling avoids "tx not yet on a block" races.
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: 90_000,
        pollingInterval: 2_000,
        retryCount: 6,
      });

      logger.info(
        `0g-chain anchored rootHash=${rootHash} tx=${txHash} block=${receipt.blockNumber} contract=${config.LPDOCTOR_REPORTS_CONTRACT ?? "self-tx"}`,
      );

      return {
        txHash,
        blockNumber: Number(receipt.blockNumber),
        chainId: config.OG_CHAIN_ID,
        explorerUrl: `${EXPLORER_BASE}/${txHash}`,
        contract: config.LPDOCTOR_REPORTS_CONTRACT,
        stub: false,
      };
    } catch (err) {
      if (config.LPDOCTOR_REPORTS_CONTRACT && txHash) {
        try {
          const report = await publicClient.readContract({
            address: config.LPDOCTOR_REPORTS_CONTRACT as Hex,
            abi: LPDOCTOR_REPORTS_ABI,
            functionName: "reports",
            args: [normalizeHex(rootHash)],
          });
          if (report[0] !== "0x0000000000000000000000000000000000000000") {
            logger.warn(
              `0g-chain anchor receipt lookup failed, but report is present on-chain rootHash=${rootHash} tx=${txHash}`,
            );
            return {
              txHash,
              chainId: config.OG_CHAIN_ID,
              explorerUrl: `${EXPLORER_BASE}/${txHash}`,
              contract: config.LPDOCTOR_REPORTS_CONTRACT,
              stub: false,
            };
          }
        } catch (confirmErr) {
          logger.warn(
            `0g-chain post-error confirmation failed: ${
              confirmErr instanceof Error ? confirmErr.message : String(confirmErr)
            }`,
          );
        }
      }
      const stubTx = stubTxHash(rootHash);
      logger.error(
        `0g-chain anchor failed, returning stub: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return {
        txHash: stubTx,
        chainId: config.OG_CHAIN_ID,
        explorerUrl: `stub://og-chain/${stubTx}`,
        stub: true,
      };
    }
  }

  // Anchors the latest diagnose's rootHash inside the agent's iNFT
  // memory + bumps reputation. Best-effort: any failure here is
  // logged + reflected in the returned warnings, but does NOT fail
  // the parent diagnose run. Skipped when LPDOCTOR_AGENT_TOKEN_ID is 0
  // (iNFT not minted) or the anchor key isn't configured.
  async updateAgentMemory(rootHash: string): Promise<AgentMemoryUpdate> {
    const tokenId = config.LPDOCTOR_AGENT_TOKEN_ID;
    const contract = config.LPDOCTOR_AGENT_CONTRACT ?? "";
    const warnings: string[] = [];

    if (!tokenId || !contract) {
      warnings.push(
        "iNFT update skipped — LPDOCTOR_AGENT_TOKEN_ID or LPDOCTOR_AGENT_CONTRACT not set",
      );
      return {
        tokenId,
        contract,
        memoryRoot: rootHash,
        reputation: 0,
        stub: true,
        warnings,
      };
    }

    if (!config.OG_ANCHOR_PRIVATE_KEY) {
      warnings.push("iNFT update skipped — no anchor signing key");
      return {
        tokenId,
        contract,
        memoryRoot: rootHash,
        reputation: 0,
        stub: true,
        warnings,
      };
    }

    try {
      const account = privateKeyToAccount(
        normalizeHex(config.OG_ANCHOR_PRIVATE_KEY),
      );
      const wallet = createWalletClient({
        account,
        chain: zeroGGalileo,
        transport: http(),
      });
      const publicClient = createPublicClient({
        chain: zeroGGalileo,
        transport: http(),
      });
      const agentAddr = contract as Hex;
      const before = await this.readAgentState(publicClient, agentAddr, tokenId);

      // 1. updateMemoryRoot — points the iNFT's persistent memory at
      //    the latest report on 0G Storage.
      const updateMemoryTx = await wallet.writeContract({
        address: agentAddr,
        abi: LPDOCTOR_AGENT_ABI,
        functionName: "updateMemoryRoot",
        args: [BigInt(tokenId), normalizeHex(rootHash)],
      });
      try {
        await publicClient.waitForTransactionReceipt({
          hash: updateMemoryTx,
          timeout: 90_000,
          pollingInterval: 2_000,
          retryCount: 6,
        });
      } catch (err) {
        const postUpdate = await this.readAgentState(publicClient, agentAddr, tokenId);
        if (postUpdate.memoryRoot !== normalizeHex(rootHash)) {
          throw err;
        }
        logger.warn(
          `0g-chain updateMemoryRoot receipt lookup failed, but memoryRoot already updated tokenId=${tokenId} tx=${updateMemoryTx}`,
        );
      }

      // 2. recordDiagnose — increments the on-chain reputation
      //    counter (one per anchored report).
      const recordDiagnoseTx = await wallet.writeContract({
        address: agentAddr,
        abi: LPDOCTOR_AGENT_ABI,
        functionName: "recordDiagnose",
        args: [BigInt(tokenId)],
      });
      try {
        await publicClient.waitForTransactionReceipt({
          hash: recordDiagnoseTx,
          timeout: 90_000,
          pollingInterval: 2_000,
          retryCount: 6,
        });
      } catch (err) {
        const postDiagnose = await this.readAgentState(
          publicClient,
          agentAddr,
          tokenId,
        );
        if (postDiagnose.reputation <= before.reputation) {
          throw err;
        }
        logger.warn(
          `0g-chain recordDiagnose receipt lookup failed, but reputation already incremented tokenId=${tokenId} tx=${recordDiagnoseTx}`,
        );
      }

      // 3. Read back the post-state so the report payload (and the UI)
      //    can show the live memoryRoot + reputation counter.
      const agent = await this.readAgentState(publicClient, agentAddr, tokenId);

      logger.info(
        `0g-chain agent iNFT updated tokenId=${tokenId} memoryRoot=${agent.memoryRoot} reputation=${agent.reputation} migrations=${agent.migrationsTriggered} updateTx=${updateMemoryTx} recordTx=${recordDiagnoseTx}`,
      );

      return {
        tokenId,
        contract,
        memoryRoot: agent.memoryRoot,
        reputation: agent.reputation,
        migrationsTriggered: agent.migrationsTriggered,
        updateMemoryTx,
        recordDiagnoseTx,
        stub: false,
        warnings,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`0g-chain agent iNFT update failed: ${msg}`);
      warnings.push(`iNFT update failed: ${msg}`);
      return {
        tokenId,
        contract,
        memoryRoot: rootHash,
        reputation: 0,
        stub: true,
        warnings,
      };
    }
  }

  // Records a Permit2 migration on the iNFT — called by the migrate
  // route after the user signs the EIP-712 PermitSingle in the modal.
  // The digest is the typed-data hash of the signed bundle; embedding
  // it on chain proves the agent's diagnose led to a real (signed)
  // user action, not just a screen render. Best-effort: failures are
  // logged + reflected in warnings, never thrown to the caller.
  async recordMigration(
    permit2Digest: string,
  ): Promise<MigrationRecordReceipt> {
    const tokenId = config.LPDOCTOR_AGENT_TOKEN_ID;
    const contract = config.LPDOCTOR_AGENT_CONTRACT ?? "";
    const warnings: string[] = [];

    if (!tokenId || !contract) {
      warnings.push(
        "recordMigration skipped — LPDOCTOR_AGENT_TOKEN_ID or LPDOCTOR_AGENT_CONTRACT not set",
      );
      return {
        tokenId,
        contract,
        permit2Digest,
        migrationsTriggered: 0,
        stub: true,
        warnings,
      };
    }

    if (!config.OG_ANCHOR_PRIVATE_KEY) {
      warnings.push("recordMigration skipped — no anchor signing key");
      return {
        tokenId,
        contract,
        permit2Digest,
        migrationsTriggered: 0,
        stub: true,
        warnings,
      };
    }

    try {
      const account = privateKeyToAccount(
        normalizeHex(config.OG_ANCHOR_PRIVATE_KEY),
      );
      const wallet = createWalletClient({
        account,
        chain: zeroGGalileo,
        transport: http(),
      });
      const publicClient = createPublicClient({
        chain: zeroGGalileo,
        transport: http(),
      });
      const agentAddr = contract as Hex;

      const txHash = await wallet.writeContract({
        address: agentAddr,
        abi: LPDOCTOR_AGENT_ABI,
        functionName: "recordMigration",
        args: [BigInt(tokenId), normalizeHex(permit2Digest)],
      });
      await publicClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: 90_000,
        pollingInterval: 2_000,
        retryCount: 6,
      });

      const agent = (await publicClient.readContract({
        address: agentAddr,
        abi: LPDOCTOR_AGENT_ABI,
        functionName: "agents",
        args: [BigInt(tokenId)],
      })) as readonly [
        Hex,
        Hex,
        Hex,
        bigint,
        bigint,
        bigint,
        bigint,
        string,
      ];

      logger.info(
        `0g-chain migration recorded tokenId=${tokenId} digest=${permit2Digest} migrations=${agent[6]} tx=${txHash}`,
      );

      return {
        tokenId,
        contract,
        permit2Digest,
        migrationsTriggered: Number(agent[6]),
        txHash,
        explorerUrl: `${EXPLORER_BASE}/${txHash}`,
        stub: false,
        warnings,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`0g-chain recordMigration failed: ${msg}`);
      warnings.push(`recordMigration failed: ${msg}`);
      return {
        tokenId,
        contract,
        permit2Digest,
        migrationsTriggered: 0,
        stub: true,
        warnings,
      };
    }
  }

  private async readAgentState(
    publicClient: ReturnType<typeof createPublicClient>,
    agentAddr: Hex,
    tokenId: number,
  ): Promise<{
    owner: Hex;
    memoryRoot: Hex;
    reputation: number;
    migrationsTriggered: number;
    metadataUri: string;
  }> {
    const agent = (await publicClient.readContract({
      address: agentAddr,
      abi: LPDOCTOR_AGENT_ABI,
      functionName: "agents",
      args: [BigInt(tokenId)],
    })) as readonly [
      Hex,
      Hex,
      Hex,
      bigint,
      bigint,
      bigint,
      bigint,
      string,
    ];

    return {
      owner: agent[0],
      memoryRoot: agent[1],
      reputation: Number(agent[5]),
      migrationsTriggered: Number(agent[6]),
      metadataUri: agent[7],
    };
  }
}

function normalizeHex(value: string): Hex {
  return (value.startsWith("0x") ? value : `0x${value}`) as Hex;
}

function stubTxHash(rootHash: string): string {
  // Deterministic stub — keccak the rootHash to a fixed-shape, identifiable
  // value. Prefix `0xstub` so the frontend can detect and label it.
  const fingerprint = keccak256(toHex(rootHash));
  return `0xstub${fingerprint.slice(2, 14)}${fingerprint.slice(-12)}`;
}

export const ogChain = new OgChainClient();
