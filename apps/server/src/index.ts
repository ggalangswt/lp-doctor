import cors from "cors";
import express, { type Request, type Response } from "express";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { diagnoseHandler } from "./routes/diagnose.js";
import { migrateRecordedHandler } from "./routes/migrate.js";
import { reportCache } from "./services/reportCache.js";
import { subgraph } from "./services/subgraph.js";
import { deriveV4Positions } from "./services/v4Aggregator.js";
import { v4PositionManager } from "./services/v4PositionManager.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "lpdoctor-server",
    env: config.NODE_ENV,
    subgraph: subgraph.isReady() ? "ready" : "no-api-key",
    subgraphV4: subgraph.isReadyV4() ? "ready" : "no-api-key",
    v4PositionManager: v4PositionManager.isReady() ? "ready" : "no-rpc",
  });
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

app.listen(config.PORT, () => {
  logger.info(`lpdoctor-server listening on :${config.PORT}`);
});
