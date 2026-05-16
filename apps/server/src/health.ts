export type HealthState =
  | "ready"
  | "degraded"
  | "configured"
  | "stub"
  | "missing";

export interface HealthInputs {
  env: string;
  port: number;
  chainId: number;
  databaseConfigured: boolean;
  redisConfigured: boolean;
  galileoRpcConfigured: boolean;
  reportsContractConfigured: boolean;
  agentContractConfigured: boolean;
  agentTokenId: number;
  subgraphV3Ready: boolean;
  subgraphV4Ready: boolean;
  v4PositionManagerReady: boolean;
  tradingApiReady: boolean;
  storageReady: boolean;
  anchorReady: boolean;
  computeReady: boolean;
}

export function buildHealthResponse(input: HealthInputs) {
  const network = input.chainId === 16661 ? "0g-mainnet" : "0g-galileo";
  const readPathStatus: HealthState =
    input.subgraphV3Ready && input.subgraphV4Ready ? "ready" : "degraded";
  const writePathStatus: HealthState =
    input.storageReady &&
    input.anchorReady &&
    input.computeReady &&
    input.reportsContractConfigured &&
    input.agentContractConfigured &&
    input.agentTokenId > 0
      ? "ready"
      : "stub";

  return {
    status:
      readPathStatus === "ready" && input.galileoRpcConfigured
        ? "ok"
        : "degraded",
    service: "lpdoctor-server",
    env: input.env,
    port: input.port,
    mode: {
      readPath: readPathStatus,
      writePath: writePathStatus,
    },
    chain: {
      network,
      chainId: input.chainId,
      rpc: input.galileoRpcConfigured ? "configured" : "missing",
      reportsContract: input.reportsContractConfigured
        ? "configured"
        : "missing",
      agentContract: input.agentContractConfigured ? "configured" : "missing",
      agentToken: input.agentTokenId > 0 ? "configured" : "missing",
    },
    dependencies: {
      database: input.databaseConfigured ? "configured" : "missing",
      redis: input.redisConfigured ? "configured" : "missing",
      subgraphV3: input.subgraphV3Ready ? "ready" : "missing",
      subgraphV4: input.subgraphV4Ready ? "ready" : "missing",
      v4PositionManager: input.v4PositionManagerReady ? "ready" : "missing",
      tradingApi: input.tradingApiReady ? "ready" : "missing",
      reportCache: "ready" as const,
    },
    adapters: {
      storage: input.storageReady ? "configured" : "stub",
      anchor: input.anchorReady ? "configured" : "stub",
      compute: input.computeReady ? "configured" : "stub",
    },
  };
}
