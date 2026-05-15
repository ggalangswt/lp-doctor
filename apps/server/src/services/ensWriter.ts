import {
  createPublicClient,
  createWalletClient,
  http,
  namehash,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet, sepolia } from "viem/chains";
import { config } from "../config.js";
import { logger } from "../logger.js";

// ENS adapter — publishes per-position text records on a parent ENS name
// owned by the agent. The records anchor the diagnosis trio (storage
// rootHash + chain anchor txHash + verdict markdown excerpt) under
// structured keys keyed by the position's tokenId. Resolving the parent
// name then returns the full provenance triple for any tokenId — see
// LPDoctorReports on 0G Chain for the on-chain analogue.
//
// Falls back to a deterministic stub when ENS_PARENT_PRIVATE_KEY is not
// configured, so the demo flow stays intact.

const PUBLIC_RESOLVER_ABI = [
  {
    name: "setText",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "key", type: "string" },
      { name: "value", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "text",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "key", type: "string" },
    ],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

export interface EnsRecordWrite {
  key: string;
  value: string;
  txHash?: string;
}

export interface EnsPublishResult {
  parentName: string;
  subnameLabel: string;     // e.g. "483104"
  records: EnsRecordWrite[];
  resolverAddress: string;
  network: "mainnet" | "sepolia";
  stub: boolean;
}

const NETWORKS = { mainnet, sepolia } as const;

export class EnsWriterClient {
  isReady(): boolean {
    return Boolean(config.ENS_PARENT_PRIVATE_KEY);
  }

  async publish(args: {
    tokenId: string;
    rootHash: string;
    storageUrl: string;
    anchorTxHash?: string;
    chainId?: number;
    verdictExcerpt?: string;
  }): Promise<EnsPublishResult> {
    const records: EnsRecordWrite[] = [
      { key: `lpdoctor.${args.tokenId}.rootHash`, value: args.rootHash },
      { key: `lpdoctor.${args.tokenId}.storageUrl`, value: args.storageUrl },
      ...(args.anchorTxHash
        ? [{ key: `lpdoctor.${args.tokenId}.anchorTx`, value: args.anchorTxHash }]
        : []),
      ...(args.chainId !== undefined
        ? [{ key: `lpdoctor.${args.tokenId}.chainId`, value: String(args.chainId) }]
        : []),
      ...(args.verdictExcerpt
        ? [{ key: `lpdoctor.${args.tokenId}.verdict`, value: args.verdictExcerpt.slice(0, 240) }]
        : []),
    ];

    if (!this.isReady() || !config.ENS_PARENT_PRIVATE_KEY) {
      logger.info(
        `ens stub publish (no parent key) tokenId=${args.tokenId} keys=${records.length}`,
      );
      return {
        parentName: config.ENS_PARENT_NAME,
        subnameLabel: args.tokenId,
        records,
        resolverAddress: config.ENS_RESOLVER_ADDRESS,
        network: config.ENS_NETWORK,
        stub: true,
      };
    }

    try {
      const chain = NETWORKS[config.ENS_NETWORK];
      const transport = http(
        config.ENS_NETWORK === "mainnet" ? config.MAINNET_RPC : config.SEPOLIA_RPC,
      );
      const account = privateKeyToAccount(
        normalizeHex(config.ENS_PARENT_PRIVATE_KEY),
      );
      const walletClient = createWalletClient({ account, chain, transport });
      const publicClient = createPublicClient({ chain, transport });

      const node = namehash(config.ENS_PARENT_NAME);
      const resolver = config.ENS_RESOLVER_ADDRESS as Hex;

      for (const rec of records) {
        const txHash = await walletClient.writeContract({
          address: resolver,
          abi: PUBLIC_RESOLVER_ABI,
          functionName: "setText",
          args: [node, rec.key, rec.value],
        });
        await publicClient.waitForTransactionReceipt({
          hash: txHash,
          timeout: 60_000,
        });
        rec.txHash = txHash;
      }

      logger.info(
        `ens published tokenId=${args.tokenId} keys=${records.length} parent=${config.ENS_PARENT_NAME} network=${config.ENS_NETWORK}`,
      );

      return {
        parentName: config.ENS_PARENT_NAME,
        subnameLabel: args.tokenId,
        records,
        resolverAddress: config.ENS_RESOLVER_ADDRESS,
        network: config.ENS_NETWORK,
        stub: false,
      };
    } catch (err) {
      logger.error(
        `ens publish failed, returning stub: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return {
        parentName: config.ENS_PARENT_NAME,
        subnameLabel: args.tokenId,
        records,
        resolverAddress: config.ENS_RESOLVER_ADDRESS,
        network: config.ENS_NETWORK,
        stub: true,
      };
    }
  }
}

function normalizeHex(value: string): Hex {
  return (value.startsWith("0x") ? value : `0x${value}`) as Hex;
}

export const ensWriter = new EnsWriterClient();
