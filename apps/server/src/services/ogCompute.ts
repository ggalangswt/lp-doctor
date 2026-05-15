import { createRequire } from "node:module";
import { ethers } from "ethers";
import type { createZGComputeNetworkBroker as createZGComputeNetworkBrokerT } from "@0glabs/0g-serving-broker";
import OpenAI from "openai";
import { config } from "../config.js";
import { logger } from "../logger.js";

// @0glabs/0g-serving-broker@0.7.5 ships a broken ESM build (re-exports
// minified symbols that don't exist in the chunk it points at). Bridge
// to the working CJS build via createRequire — same pattern used for
// @uniswap/v3-sdk. Types stay TS-resolved.
const require = createRequire(import.meta.url);
const broker0g = require("@0glabs/0g-serving-broker") as {
  createZGComputeNetworkBroker: typeof createZGComputeNetworkBrokerT;
};
const { createZGComputeNetworkBroker } = broker0g;

// 0G Compute adapter — uses the broker SDK to discover a TEE-attested
// inference provider, then calls it via an OpenAI-compatible client with
// broker-signed request headers. The signed response is verifiable
// against the provider's TEE attestation report. If the broker isn't
// configured (no OG_COMPUTE_PRIVATE_KEY) or the call fails, we return a
// deterministic stub verdict so the demo flow stays intact.

interface BrokerService {
  provider: string;
  model: string;
  url: string;
}

export interface VerdictResult {
  markdown: string;
  model: string;
  providerAddress?: string;
  stub: boolean;
  latencyMs: number;
}

const SYSTEM_PROMPT =
  "You are LPDoctor, an autonomous diagnostic agent for Uniswap V3 LP positions. " +
  "You receive a structured report describing a position's state, impermanent loss, " +
  "regime, candidate v4 hooks, and migration plan. Write a 3-sentence verdict for the LP " +
  "holder in plain English. Ground every claim in the report data. Do not invent numbers " +
  "or hooks. Output plain markdown, no preamble, no headings.";

export class OgComputeClient {
  private broker: Awaited<ReturnType<typeof createZGComputeNetworkBroker>> | null = null;
  private service: BrokerService | null = null;

  isReady(): boolean {
    return Boolean(config.OG_COMPUTE_PRIVATE_KEY);
  }

  private async ensureBroker(): Promise<void> {
    if (this.broker) return;
    if (!config.OG_COMPUTE_PRIVATE_KEY) {
      throw new Error("OG_COMPUTE_PRIVATE_KEY not configured");
    }
    const provider = new ethers.JsonRpcProvider(config.OG_NEWTON_RPC);
    const wallet = new ethers.Wallet(config.OG_COMPUTE_PRIVATE_KEY, provider);
    this.broker = await createZGComputeNetworkBroker(wallet);

    // Auto-bootstrap the broker ledger sub-account on first use. The
    // SDK throws "Account does not exist" when the wallet has no ledger
    // yet — calling `addLedger(balance)` creates one and seeds it with
    // the initial deposit. Idempotent: if the ledger already exists,
    // `addLedger` reverts; we swallow the "already exists" path so the
    // bootstrap is safe to run on every cold start.
    try {
      // Minimum balance per the broker SDK is 3 0G.
      logger.info("0g-compute ensuring ledger exists (addLedger 3 0G)");
      await this.broker.ledger.addLedger(3);
      logger.info("0g-compute ledger bootstrapped");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.toLowerCase().includes("already exists") ||
        msg.toLowerCase().includes("ledger exists") ||
        msg.toLowerCase().includes("ledger already")
      ) {
        logger.info("0g-compute ledger already initialised");
      } else {
        logger.warn(`0g-compute addLedger non-fatal: ${msg}`);
      }
    }
  }

  private async ensureService(): Promise<BrokerService> {
    if (this.service) return this.service;
    if (!this.broker) await this.ensureBroker();
    if (!this.broker) throw new Error("broker init failed");

    const services = await this.broker.inference.listService();
    // Broker now publishes models with a vendor/ prefix (e.g.,
    // `qwen/qwen-2.5-7b-instruct`). Accept both exact matches and
    // suffix matches so the config can use either format.
    const wanted = config.OG_COMPUTE_MODEL.toLowerCase();
    const match = services.find((s: { model: string; serviceType: string }) => {
      if (s.serviceType !== "chatbot") return false;
      const m = s.model.toLowerCase();
      return m === wanted || m.endsWith(`/${wanted}`) || wanted.endsWith(`/${m}`);
    });
    if (!match) {
      throw new Error(
        `no service for model ${config.OG_COMPUTE_MODEL}; available: ${services.map((s: { model: string }) => s.model).join(", ")}`,
      );
    }
    this.service = {
      provider: match.provider as string,
      model: match.model as string,
      url: match.url as string,
    };

    // Ensure a per-provider sub-account exists and is funded. Without
    // this, getRequestHeaders fails with "Sub-account not found" /
    // "Account does not exist". Idempotent: getAccount succeeds if the
    // account is already set up.
    if (!this.broker) throw new Error("broker missing");
    try {
      await this.broker.inference.getAccount(this.service.provider);
      logger.info(
        `0g-compute provider account ready provider=${this.service.provider}`,
      );
    } catch {
      logger.info(
        `0g-compute provider account missing — funding 1 0G to ${this.service.provider}`,
      );
      // Provider sub-account recommended min is 1 0G; below that the
      // provider may reject requests.
      await this.broker.ledger.transferFund(
        this.service.provider,
        "inference",
        1_000_000_000_000_000_000n,
      );
      logger.info(`0g-compute provider account funded`);
    }

    // Ensure the provider's TEE signer is acknowledged by the wallet.
    // Without this, signed responses cannot be verified.
    try {
      const ack = await this.broker.inference.acknowledged(
        this.service.provider,
      );
      if (!ack) {
        logger.info(
          `0g-compute acknowledging provider signer ${this.service.provider}`,
        );
        await this.broker.inference.acknowledgeProviderSigner(
          this.service.provider,
        );
      }
    } catch (err) {
      logger.warn(
        `0g-compute acknowledgement check skipped: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }

    return this.service;
  }

  async synthesizeVerdict(reportJson: string): Promise<VerdictResult> {
    const t0 = Date.now();
    if (!this.isReady()) {
      const md = stubVerdict();
      return {
        markdown: md,
        model: "stub-deterministic",
        stub: true,
        latencyMs: Date.now() - t0,
      };
    }

    try {
      await this.ensureBroker();
      const svc = await this.ensureService();
      if (!this.broker) throw new Error("broker unavailable after init");

      const messages = [
        { role: "system" as const, content: SYSTEM_PROMPT },
        {
          role: "user" as const,
          content: `Report (JSON):\n${reportJson}`,
        },
      ];

      const headers = await this.broker.inference.getRequestHeaders(
        svc.provider,
        JSON.stringify(messages),
      );

      // 0G compute providers expose the OpenAI-compatible chat endpoint
      // under `/v1/proxy` (per the broker SDK README). The OpenAI client
      // appends `/chat/completions` to that, hitting `/v1/proxy/chat/completions`
      // which the provider's reverse-proxy forwards to the model.
      const baseURL = `${svc.url.replace(/\/$/, "")}/v1/proxy`;
      logger.info(`0g-compute hitting provider ${baseURL}`);
      const client = new OpenAI({
        baseURL,
        apiKey: "0g-broker",
        defaultHeaders: headers as unknown as Record<string, string>,
      });

      const completion = await client.chat.completions.create({
        model: svc.model,
        messages,
      });

      const md = completion.choices[0]?.message?.content?.trim() ?? "";
      logger.info(
        `0g-compute verdict received model=${svc.model} provider=${svc.provider} chars=${md.length}`,
      );

      return {
        markdown: md.length > 0 ? md : stubVerdict(),
        model: svc.model,
        providerAddress: svc.provider,
        stub: md.length === 0,
        latencyMs: Date.now() - t0,
      };
    } catch (err) {
      logger.error(
        `0g-compute synthesizeVerdict failed, returning stub: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return {
        markdown: stubVerdict(),
        model: "stub-fallback",
        stub: true,
        latencyMs: Date.now() - t0,
      };
    }
  }
}

function stubVerdict(): string {
  return [
    "Verdict synthesis skipped — 0G Compute broker not configured.",
    "The diagnose stream above contains the full per-phase narrative.",
    "Configure `OG_COMPUTE_PRIVATE_KEY` on the server to enable TEE-attested verdict synthesis.",
  ].join(" ");
}

export const ogCompute = new OgComputeClient();
