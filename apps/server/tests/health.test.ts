import { describe, expect, it } from "vitest";
import { buildHealthResponse } from "../src/health.js";

describe("buildHealthResponse", () => {
  it("marks read-only demo mode as degraded + stub write-path", () => {
    const health = buildHealthResponse({
      env: "development",
      port: 3001,
      chainId: 16602,
      databaseConfigured: false,
      redisConfigured: true,
      galileoRpcConfigured: true,
      reportsContractConfigured: true,
      agentContractConfigured: true,
      agentTokenId: 1,
      subgraphV3Ready: true,
      subgraphV4Ready: true,
      v4PositionManagerReady: true,
      tradingApiReady: false,
      storageReady: false,
      anchorReady: false,
      computeReady: false,
    });

    expect(health.status).toBe("ok");
    expect(health.mode.readPath).toBe("ready");
    expect(health.mode.writePath).toBe("stub");
    expect(health.adapters.storage).toBe("stub");
    expect(health.chain.network).toBe("0g-galileo");
    expect(health.dependencies.database).toBe("missing");
  });

  it("marks missing read dependencies as degraded", () => {
    const health = buildHealthResponse({
      env: "development",
      port: 3001,
      chainId: 16602,
      databaseConfigured: false,
      redisConfigured: false,
      galileoRpcConfigured: false,
      reportsContractConfigured: false,
      agentContractConfigured: false,
      agentTokenId: 0,
      subgraphV3Ready: false,
      subgraphV4Ready: false,
      v4PositionManagerReady: false,
      tradingApiReady: false,
      storageReady: false,
      anchorReady: false,
      computeReady: false,
    });

    expect(health.status).toBe("degraded");
    expect(health.mode.readPath).toBe("degraded");
    expect(health.chain.rpc).toBe("missing");
    expect(health.chain.agentToken).toBe("missing");
    expect(health.dependencies.redis).toBe("missing");
  });
});
