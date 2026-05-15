// Phase 8 — Report Assembly + 0G Storage Upload.
// Combines all upstream phase outputs into a single Report JSON, uploads
// it to 0G Storage, returns the merkle rootHash that anchors provenance.

import type { Labeled } from "@lpdoctor/core";

export interface ReportProvenance {
  rootHash: string;
  txHash?: string;
  storageUrl: string;
  size: number;
  stub: boolean;
  uploadedAt: string;
}

export interface VerdictAttestation {
  // Type of attestation. Currently only the 0G Compute broker request
  // signature is wired; SGX / TDX attestations will land here when the
  // broker exposes them.
  type: "0g-compute-broker-signature";
  provider: string;            // 0G Compute provider address
  model: string;               // model name returned by the broker
  requestSignatureHash?: string; // keccak256 of the request-headers signature
  brokerLedgerTx?: string;     // optional broker ledger tx for this call
  generatedAt: string;
  stub: boolean;               // true when the broker call short-circuited
}

export interface AssembledReport {
  schemaVersion: 1;
  generatedAt: string;
  agent: {
    name: "lpdoctor";
    version: string;
  };
  position: {
    tokenId: string;
    version: 3 | 4;
    pair: string;
    owner: string;
  };
  attestation?: VerdictAttestation;
  il?: {
    hodlValueT1: number;
    lpValueT1: number;
    feesValueT1: number;
    ilT1: number;
    ilPct: number;
  };
  regime?: {
    topLabel: string;
    confidence: number;
    narrative: string;
  };
  hooks?: {
    pair: string;
    topFamily: string;
    candidateCount: number;
  };
  migration?: {
    targetHookAddress?: string;
    targetFamily?: string;
    priceImpactPct?: number;
    warnings: string[];
  };
}

export interface Phase8Output {
  report: Labeled<AssembledReport>;
  provenance: Labeled<ReportProvenance>;
}
