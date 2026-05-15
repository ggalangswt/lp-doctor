import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().default("redis://localhost:6379"),

  THE_GRAPH_KEY: z.string().optional(),
  UNISWAP_TRADING_API_KEY: z.string().optional(),

  OG_GALILEO_RPC: z.string().url().default("https://evmrpc-testnet.0g.ai"),
  OG_INDEXER_RPC: z.string().url().default("https://indexer-storage-testnet-turbo.0g.ai"),
  OG_STORAGE_PRIVATE_KEY: z.string().optional(),
  OG_ANCHOR_PRIVATE_KEY: z.string().optional(),
  OG_COMPUTE_PRIVATE_KEY: z.string().optional(),
  OG_COMPUTE_MODEL: z.string().default("qwen-2.5-7b-instruct"),
  OG_CHAIN_ID: z.coerce.number().int().positive().default(16602),

  LPDOCTOR_REPORTS_CONTRACT: z.string().optional(),
  LPDOCTOR_AGENT_CONTRACT: z.string().optional(),
  LPDOCTOR_AGENT_TOKEN_ID: z.coerce.number().int().nonnegative().default(0),

  ENS_PARENT_NAME: z.string().default("lpdoctor-demo.eth"),
  ENS_PARENT_PRIVATE_KEY: z.string().optional(),
  ENS_RESOLVER_ADDRESS: z.string().default("0x8FADE66B79cC9f707aB26799354482EB93a5B7dD"),
  ENS_NETWORK: z.enum(["mainnet", "sepolia"]).default("sepolia"),

  MAINNET_RPC: z.string().url().default("https://eth.llamarpc.com"),
  SEPOLIA_RPC: z.string().url().default("https://rpc.sepolia.org"),

  OPENAI_API_KEY: z.string().optional(),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
});

export type Config = z.infer<typeof schema>;

const env = {
  ...process.env,
  LPDOCTOR_REPORTS_CONTRACT: process.env.LPDOCTOR_REPORTS_CONTRACT,
  LPDOCTOR_AGENT_CONTRACT: process.env.LPDOCTOR_AGENT_CONTRACT,
  LPDOCTOR_AGENT_TOKEN_ID: process.env.LPDOCTOR_AGENT_TOKEN_ID,
};

export const config: Config = schema.parse(env);
