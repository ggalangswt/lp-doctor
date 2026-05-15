// Phase 9 — On-Chain Anchor + Agent iNFT memory update.
// Submits the report's merkle rootHash to 0G Chain so the report becomes
// tamper-evident: anyone can re-derive the rootHash from the storage blob
// and assert it matches what the agent committed on-chain.
// Also updates the LPDoctorAgent ERC-7857 iNFT's `memoryRoot` to point at
// the latest report and bumps `reputation` so the iNFT carries verifiable
// evolving intelligence/memory (per ETHGlobal 0G iNFT prize requirement).

import type { Labeled } from "@lpdoctor/core";

export interface AnchorReceipt {
  rootHash: string;
  txHash: string;
  blockNumber?: number;
  chainId: number;
  explorerUrl: string;
  anchoredAt: string;
  stub: boolean;
}

export interface AgentMemoryReceipt {
  tokenId: number;
  contract: string;
  memoryRoot: string;
  reputation: number;
  /** Counter of Permit2 migrations recorded against this iNFT. Bumped
   *  when the user signs a migration bundle in the modal — proves the
   *  agent's diagnose led to a real signed user action. */
  migrationsTriggered?: number;
  updateMemoryTx?: string;
  recordDiagnoseTx?: string;
  updatedAt: string;
  stub: boolean;
  warnings: string[];
}

export interface Phase9Output {
  anchor: Labeled<AnchorReceipt>;
  agentMemory?: Labeled<AgentMemoryReceipt>;
}
