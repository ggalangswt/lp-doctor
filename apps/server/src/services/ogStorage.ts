import { ethers } from "ethers";
import { Indexer, MemData } from "@0gfoundation/0g-ts-sdk";
import { config } from "../config.js";
import { logger } from "../logger.js";

// 0G Storage adapter — uploads JSON blobs to 0G Storage and returns the
// merkle rootHash that anchors the blob's content. If the storage signing
// key is not configured, falls back to a deterministic stub so the demo
// stays functional offline. The agent always emits the resulting rootHash
// inside a `report.uploaded` event so the frontend can show provenance.

export interface UploadResult {
  rootHash: string;
  txHash?: string;
  storageUrl: string;
  size: number;
  stub: boolean;
}

const STORAGE_VIEW_BASE = "https://storagescan-newton.0g.ai/tx";

export class OgStorageClient {
  private indexer: Indexer | null = null;
  private signer: ethers.Wallet | null = null;
  private rpcUrl = config.OG_NEWTON_RPC;
  private indexerRpc = config.OG_INDEXER_RPC;

  isReady(): boolean {
    return Boolean(config.OG_STORAGE_PRIVATE_KEY);
  }

  private ensureClients(): {
    indexer: Indexer;
    signer: ethers.Wallet;
  } | null {
    if (!config.OG_STORAGE_PRIVATE_KEY) return null;
    if (!this.indexer) this.indexer = new Indexer(this.indexerRpc);
    if (!this.signer) {
      const provider = new ethers.JsonRpcProvider(this.rpcUrl);
      this.signer = new ethers.Wallet(
        config.OG_STORAGE_PRIVATE_KEY,
        provider,
      );
    }
    return { indexer: this.indexer, signer: this.signer };
  }

  async upload(json: unknown): Promise<UploadResult> {
    const blob = new TextEncoder().encode(JSON.stringify(json, null, 2));
    const size = blob.byteLength;

    const clients = this.ensureClients();
    if (!clients) {
      const stubHash = await deterministicStubHash(blob);
      logger.info(
        `0g-storage stub upload (no signer key) size=${size} hash=${stubHash}`,
      );
      return {
        rootHash: stubHash,
        storageUrl: `stub://og-storage/${stubHash}`,
        size,
        stub: true,
      };
    }

    try {
      const mem = new MemData(blob);
      const [tree, treeErr] = await mem.merkleTree();
      if (treeErr || !tree) throw treeErr ?? new Error("merkle tree failed");
      const rootHash = tree.rootHash();
      if (!rootHash) throw new Error("rootHash empty");

      const [tx, uploadErr] = await clients.indexer.upload(
        mem,
        this.rpcUrl,
        clients.signer,
      );
      if (uploadErr) throw uploadErr;

      logger.info(
        `0g-storage uploaded size=${size} hash=${rootHash} tx=${tx ?? "n/a"}`,
      );
      return {
        rootHash,
        txHash: typeof tx === "string" ? tx : undefined,
        storageUrl:
          typeof tx === "string" ? `${STORAGE_VIEW_BASE}/${tx}` : `og://${rootHash}`,
        size,
        stub: false,
      };
    } catch (err) {
      const stubHash = await deterministicStubHash(blob);
      logger.error(
        `0g-storage upload failed, returning stub: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return {
        rootHash: stubHash,
        storageUrl: `stub://og-storage/${stubHash}`,
        size,
        stub: true,
      };
    }
  }
}

async function deterministicStubHash(blob: Uint8Array): Promise<string> {
  // Deterministic fingerprint without 0G — we keep the stub identifiable so
  // a viewer can tell it never hit the real network.
  const hash = ethers.keccak256(blob);
  return `0xstub${hash.slice(2, 10)}${hash.slice(-8)}`;
}

export const ogStorage = new OgStorageClient();
