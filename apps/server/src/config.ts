import { z } from "zod";

const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema);

const optionalUrl = emptyToUndefined(z.string().url().optional());
const defaultedString = (fallback: string) =>
  emptyToUndefined(z.string().default(fallback));
const ensNetworkSchema = emptyToUndefined(
  z.enum(["mainnet", "sepolia"]).default("sepolia"),
);

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  DATABASE_URL: optionalUrl,
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

  ENS_PARENT_NAME: defaultedString("lpdoctor-demo.eth"),
  ENS_PARENT_PRIVATE_KEY: emptyToUndefined(z.string().optional()),
  ENS_RESOLVER_ADDRESS: defaultedString(
    "0x8FADE66B79cC9f707aB26799354482EB93a5B7dD",
  ),
  ENS_NETWORK: ensNetworkSchema,

  MAINNET_RPC: defaultedString("https://eth.llamarpc.com").pipe(z.string().url()),
  SEPOLIA_RPC: defaultedString("https://rpc.sepolia.org").pipe(z.string().url()),

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
