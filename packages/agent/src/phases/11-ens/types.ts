// Phase 11 — ENS Identity Publication.
// Publishes per-position text records on the agent's parent ENS name so
// resolving the name returns the report's provenance triple. Identity
// layer for AI agents in the wild — anyone with the parent name can list
// every diagnosis the agent has anchored.

import type { Labeled } from "@lpdoctor/core";

export interface EnsRecord {
  key: string;
  value: string;
  txHash?: string;
}

export interface EnsPublication {
  parentName: string;
  subnameLabel: string;
  fullName: string;
  resolverUrl: string;
  records: EnsRecord[];
  network: "mainnet" | "sepolia";
  stub: boolean;
  publishedAt: string;
}

export interface Phase11Output {
  ens: Labeled<EnsPublication>;
}
