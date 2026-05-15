import cors from "cors";
import express, { type Request, type Response } from "express";
import { config } from "./config.js";
import { buildHealthResponse } from "./health.js";
import { logger } from "./logger.js";
import { diagnoseHandler } from "./routes/diagnose.js";
import { migrateRecordedHandler } from "./routes/migrate.js";
import { ensWriter } from "./services/ensWriter.js";
import { ogChain } from "./services/ogChain.js";
import { ogCompute } from "./services/ogCompute.js";
import { ogStorage } from "./services/ogStorage.js";
import { reportCache } from "./services/reportCache.js";
import { subgraph } from "./services/subgraph.js";
import { tradingApi } from "./services/tradingApi.js";
import { deriveV4Positions } from "./services/v4Aggregator.js";
import { v4PositionManager } from "./services/v4PositionManager.js";

const app = express();

app.use(cors());
app.use(express.json());

function readHealth() {
  return buildHealthResponse({
    env: config.NODE_ENV,
    port: config.PORT,
    chainId: config.OG_CHAIN_ID,
    databaseConfigured: Boolean(config.DATABASE_URL),
    redisConfigured: Boolean(config.REDIS_URL),
    galileoRpcConfigured: Boolean(config.OG_GALILEO_RPC),
    reportsContractConfigured: Boolean(config.LPDOCTOR_REPORTS_CONTRACT),
    agentContractConfigured: Boolean(config.LPDOCTOR_AGENT_CONTRACT),
    agentTokenId: config.LPDOCTOR_AGENT_TOKEN_ID,
    subgraphV3Ready: subgraph.isReady(),
    subgraphV4Ready: subgraph.isReadyV4(),
    v4PositionManagerReady: v4PositionManager.isReady(),
    tradingApiReady: tradingApi.isReady(),
    storageReady: ogStorage.isReady(),
    anchorReady: ogChain.isReady(),
    computeReady: ogCompute.isReady(),
    ensReady: ensWriter.isReady(),
  });
}

app.get("/health", (_req: Request, res: Response) => {
  res.json(readHealth());
});

app.get<{ address: string }>(
  "/api/positions/:address",
  async (req, res) => {
    const { address } = req.params;
    try {
      const positions = await subgraph.getV3PositionsByOwner(address);
      res.json({ address, version: 3, positions });
    } catch (err) {
      logger.error(
        `subgraph getV3PositionsByOwner failed for ${address}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      res.status(502).json({ error: "subgraph unavailable" });
    }
  },
);

app.get<{ address: string }>(
  "/api/positions/v4/:address",
  async (req, res) => {
    const { address } = req.params;
    try {
      const events = await subgraph.getV4ModifyLiquiditiesByOrigin(address);
      const derived = deriveV4Positions(events).map((p) => ({
        ...p,
        netLiquidity: p.netLiquidity.toString(),
      }));
      res.json({ address, version: 4, positions: derived });
    } catch (err) {
      logger.error(
        `subgraph getV4ModifyLiquiditiesByOrigin failed for ${address}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      res.status(502).json({ error: "subgraph v4 unavailable" });
    }
  },
);

app.get<{ tokenId: string }>(
  "/api/positions/v4/:tokenId/info",
  async (req, res) => {
    const { tokenId } = req.params;
    if (!v4PositionManager.isReady()) {
      res.status(503).json({
        error: "v4 position manager not configured (set MAINNET_RPC)",
      });
      return;
    }
    const result = await v4PositionManager.fetch(tokenId);
    if ("error" in result) {
      res.status(502).json(result);
      return;
    }
    res.json(result);
  },
);

app.get<{ tokenId: string }>("/api/diagnose/:tokenId", diagnoseHandler);

app.post<{ tokenId: string }>(
  "/api/migrate/:tokenId/recorded",
  migrateRecordedHandler,
);

app.get<{ rootHash: string }>("/api/report/:rootHash", (req, res) => {
  const cached = reportCache.get(req.params.rootHash);
  if (!cached) {
    res.status(404).json({ error: "report not found" });
    return;
  }
  res.json(cached);
});

const server = app.listen(config.PORT, () => {
  logger.info(`lpdoctor-server listening on :${config.PORT}`);
  const health = readHealth();
  logger.info(
    [
      "backend readiness",
      `readPath=${health.mode.readPath}`,
      `writePath=${health.mode.writePath}`,
      `chain=${health.chain.network}:${health.chain.chainId}`,
      `database=${health.dependencies.database}`,
      `redis=${health.dependencies.redis}`,
      `reports=${health.chain.reportsContract}`,
      `agent=${health.chain.agentContract}`,
      `agentToken=${health.chain.agentToken}`,
      `subgraphV3=${health.dependencies.subgraphV3}`,
      `subgraphV4=${health.dependencies.subgraphV4}`,
      `v4pm=${health.dependencies.v4PositionManager}`,
      `storage=${health.adapters.storage}`,
      `anchor=${health.adapters.anchor}`,
      `compute=${health.adapters.compute}`,
      `ens=${health.adapters.ens}`,
    ].join(" "),
  );
});

server.on("error", (err) => {
  logger.error(
    `lpdoctor-server failed to bind :${config.PORT}: ${
      err instanceof Error ? err.message : String(err)
    }`,
  );
});
