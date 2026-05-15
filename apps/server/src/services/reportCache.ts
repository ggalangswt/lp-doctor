import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { logger } from "../logger.js";

// Local file-based cache of assembled reports keyed by rootHash. After
// phase 8 uploads a report to 0G Storage, we keep a local mirror so the
// /api/report/:rootHash endpoint can serve it without re-downloading
// from 0G (which would be slow + flaky in a demo). The cache is also a
// safety net when the storage upload short-circuits to a stub: the
// report stays viewable even though it never hit the network.

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, "..", "..", "cache", "reports");

function ensureDir(): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function safeKey(rootHash: string): string | null {
  // Only allow hex-like characters to avoid path traversal.
  return /^0x[a-z0-9]{8,80}$/i.test(rootHash) ? rootHash.toLowerCase() : null;
}

export interface CachedReport {
  rootHash: string;
  storageUrl: string;
  anchorTxHash?: string;
  anchorChainId?: number;
  storageStub: boolean;
  anchorStub?: boolean;
  cachedAt: string;
  payload: unknown;
}

export class ReportCache {
  put(entry: CachedReport): void {
    const key = safeKey(entry.rootHash);
    if (!key) {
      logger.warn(`report cache rejected unsafe rootHash: ${entry.rootHash}`);
      return;
    }
    ensureDir();
    const path = join(CACHE_DIR, `${key}.json`);
    writeFileSync(path, JSON.stringify(entry, null, 2));
    logger.info(`report cached locally rootHash=${entry.rootHash}`);
  }

  get(rootHash: string): CachedReport | null {
    const key = safeKey(rootHash);
    if (!key) return null;
    const path = join(CACHE_DIR, `${key}.json`);
    if (!existsSync(path)) return null;
    try {
      const raw = readFileSync(path, "utf-8");
      return JSON.parse(raw) as CachedReport;
    } catch (err) {
      logger.error(
        `report cache read failed for ${rootHash}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return null;
    }
  }
}

export const reportCache = new ReportCache();
