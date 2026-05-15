import type { Request, Response } from "express";
import {
  assembleReport,
  runPhase1,
  runPhase3,
  runPhase4,
  runPhase5,
  runPhase6,
  runPhase7,
  runPhase8,
  runPhase9,
  runPhase10,
  type AgentMemoryUpdater,
  type Quoter,
  type QuoteSummary,
  type ReportAnchorer,
  type ReportUploader,
  type VerdictSynthesizer,
} from "@lpdoctor/agent";
import { SSEStream } from "../lib/sse.js";
import { logger } from "../logger.js";
import { subgraph } from "../services/subgraph.js";
import { tradingApi } from "../services/tradingApi.js";
import { ogStorage } from "../services/ogStorage.js";
import { ogChain } from "../services/ogChain.js";
import { ogCompute } from "../services/ogCompute.js";
import { reportCache } from "../services/reportCache.js";

export async function diagnoseHandler(
  req: Request<{ tokenId: string }>,
  res: Response,
): Promise<void> {
  const { tokenId } = req.params;
  const sse = new SSEStream(res);

  req.on("close", () => {
    logger.info(`diagnose stream closed by client (tokenId=${tokenId})`);
  });

  // Preflight phase 0 — subgraph readiness banner.
  sse.emit({
    type: "phase.start",
    phase: 0,
    label: subgraph.isReady() ? "subgraph ready" : "subgraph degraded",
  });
  sse.emit({ type: "phase.end", phase: 0, durationMs: 0 });

  try {
    const quoteSwap: Quoter | undefined = tradingApi.isReady()
      ? async (args): Promise<QuoteSummary | null> => {
          try {
            const r = await tradingApi.quote({
              tokenIn: args.tokenIn,
              tokenOut: args.tokenOut,
              amount: args.amount,
              chainId: args.chainId,
              swapper: args.swapper,
            });
            return {
              routing: r.routing,
              route: r.quote.route,
              input: r.quote.input,
              output: {
                amount: r.quote.output.amount,
                token: r.quote.output.token,
              },
              slippage: r.quote.slippage,
              priceImpact: r.quote.priceImpact,
              gasFeeUSD: r.quote.gasFeeUSD,
            };
          } catch (err) {
            logger.error(
              `tradingApi.quote failed: ${
                err instanceof Error ? err.message : String(err)
              }`,
            );
            return null;
          }
        }
      : undefined;

    const uploadReport: ReportUploader = async (report) => {
      const result = await ogStorage.upload(report);
      return {
        rootHash: result.rootHash,
        txHash: result.txHash,
        storageUrl: result.storageUrl,
        size: result.size,
        stub: result.stub,
      };
    };

    // Set after runPhase1 resolves so the LPDoctorReports contract call
    // (when configured) can index the report by tokenId.
    let anchorTokenId: string | undefined;
    const anchorReport: ReportAnchorer = async (rootHash) => {
      const result = await ogChain.anchor(rootHash, anchorTokenId);
      return {
        txHash: result.txHash,
        blockNumber: result.blockNumber,
        chainId: result.chainId,
        explorerUrl: result.explorerUrl,
        stub: result.stub,
      };
    };

    const updateAgentMemory: AgentMemoryUpdater = async (rootHash) => {
      const result = await ogChain.updateAgentMemory(rootHash);
      return {
        tokenId: result.tokenId,
        contract: result.contract,
        memoryRoot: result.memoryRoot,
        reputation: result.reputation,
        migrationsTriggered: result.migrationsTriggered,
        updateMemoryTx: result.updateMemoryTx,
        recordDiagnoseTx: result.recordDiagnoseTx,
        stub: result.stub,
        warnings: result.warnings,
      };
    };

    const synthesizeVerdict: VerdictSynthesizer = async (reportJson) => {
      const result = await ogCompute.synthesizeVerdict(reportJson);
      return {
        markdown: result.markdown,
        model: result.model,
        providerAddress: result.providerAddress,
        stub: result.stub,
        latencyMs: result.latencyMs,
      };
    };

    const deps = {
      fetchV3Position: (id: string) => subgraph.getV3PositionById(id),
      fetchPoolHourDatas: (poolId: string, from: number) =>
        subgraph.getV3PoolHourDatas(poolId, from),
      fetchV4HookedPools: (token0: string, token1: string) =>
        subgraph.getV4HookedPoolsByPair(token0, token1),
      quoteSwap,
      uploadReport,
      anchorReport,
      updateAgentMemory,
      synthesizeVerdict,
    };

    const position = await runPhase1(tokenId, deps, (event) => sse.emit(event));
    anchorTokenId = position.tokenId;
    const il = await runPhase3(position, (event) => sse.emit(event));
    const regime = await runPhase4(position, deps, (event) => sse.emit(event));
    const hooks = await runPhase5(position, deps, (event) => sse.emit(event));
    const scoring = await runPhase6(
      position,
      { regime, hooks, il },
      deps,
      (event) => sse.emit(event),
    );
    void scoring;
    const migration = await runPhase7(position, hooks, deps, (event) =>
      sse.emit(event),
    );

    // Phase 10 runs BEFORE phase 8 so the verdict's TEE attestation
    // (provider, model, broker signature) lands inside the report
    // payload that phase 8 uploads to 0G Storage. The draft report has
    // every structured field except provenance + attestation; phase 10
    // only reads the structured data, so building it twice is cheap.
    const draftReport = assembleReport({
      position,
      il,
      regime,
      hooks,
      migration,
    });
    const verdict = await runPhase10(draftReport, deps, (event) =>
      sse.emit(event),
    );
    const storage = await runPhase8(
      position,
      { il, regime, hooks, migration, verdict },
      deps,
      (event) => sse.emit(event),
    );

    // Cache the report as soon as phase 8 completes so the
    // /api/report/:rootHash endpoint resolves immediately, even if the
    // user clicks "view report" before phase 9 (anchor) finishes.
    // Anchor metadata is filled in by a second put() once phase 9
    // returns.
    if (storage) {
      const provenance = storage.provenance.value;
      reportCache.put({
        rootHash: provenance.rootHash,
        storageUrl: provenance.storageUrl,
        storageStub: provenance.stub,
        cachedAt: new Date().toISOString(),
        payload: storage.report.value,
      });
    }

    const anchor = await runPhase9(storage, deps, (event) => sse.emit(event));

    if (storage) {
      const provenance = storage.provenance.value;
      reportCache.put({
        rootHash: provenance.rootHash,
        storageUrl: provenance.storageUrl,
        anchorTxHash: anchor?.anchor.value.txHash,
        anchorChainId: anchor?.anchor.value.chainId,
        storageStub: provenance.stub,
        anchorStub: anchor?.anchor.value.stub,
        cachedAt: new Date().toISOString(),
        payload: storage.report.value,
      });
    }
  } catch (err) {
    logger.error(
      `diagnose stream errored for ${tokenId}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    sse.emit({
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    });
  } finally {
    sse.close();
  }
}
