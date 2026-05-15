import { decodeFlags, HOOK_FLAGS, type FlagName } from "./flags.js";
import type { HookFamily } from "./types.js";

// Maps the permission-flag bitmap of a hook to a coarse family label.
// Patterns observed live on V4 mainnet (data/hook-corpus-seed.md research
// notes). Hooks that don't match a known pattern fall back to UNKNOWN.

interface Pattern {
  family: HookFamily;
  required: number;
  forbidden?: number;
}

const PATTERNS: Pattern[] = [
  // Dynamic-fee advanced — uses DYNAMIC_FEE_FLAG fee + multiple hooks +
  // returns-delta on swap. Observed on USDC/WETH and WETH/USDT.
  {
    family: "DYNAMIC_FEE_ADVANCED",
    required:
      HOOK_FLAGS.BEFORE_INITIALIZE |
      HOOK_FLAGS.AFTER_INITIALIZE |
      HOOK_FLAGS.BEFORE_SWAP |
      HOOK_FLAGS.AFTER_SWAP |
      HOOK_FLAGS.AFTER_SWAP_RETURNS_DELTA,
  },
  // Swap-delta cut — takes a fee via after-swap delta only.
  {
    family: "SWAP_DELTA_CUT",
    required:
      HOOK_FLAGS.BEFORE_SWAP |
      HOOK_FLAGS.AFTER_SWAP |
      HOOK_FLAGS.AFTER_SWAP_RETURNS_DELTA,
    forbidden: HOOK_FLAGS.BEFORE_INITIALIZE | HOOK_FLAGS.AFTER_INITIALIZE,
  },
  // Memecoin royalty — variable BEFORE_INITIALIZE / ADD_LIQ + AFTER_SWAP_RETURNS_DELTA.
  {
    family: "MEMECOIN_ROYALTY",
    required:
      HOOK_FLAGS.BEFORE_INITIALIZE |
      HOOK_FLAGS.AFTER_SWAP |
      HOOK_FLAGS.AFTER_SWAP_RETURNS_DELTA,
  },
  // Custom lifecycle — full ADD/REMOVE LIQ + SWAP coverage, no returns-delta.
  {
    family: "CUSTOM_LIFECYCLE",
    required:
      HOOK_FLAGS.BEFORE_ADD_LIQUIDITY |
      HOOK_FLAGS.AFTER_ADD_LIQUIDITY |
      HOOK_FLAGS.BEFORE_REMOVE_LIQUIDITY |
      HOOK_FLAGS.AFTER_REMOVE_LIQUIDITY |
      HOOK_FLAGS.BEFORE_SWAP |
      HOOK_FLAGS.AFTER_SWAP,
    forbidden:
      HOOK_FLAGS.AFTER_SWAP_RETURNS_DELTA |
      HOOK_FLAGS.BEFORE_SWAP_RETURNS_DELTA,
  },
  // Gated swap — beforeInitialize + beforeSwap only.
  {
    family: "GATED_SWAP",
    required: HOOK_FLAGS.BEFORE_INITIALIZE | HOOK_FLAGS.BEFORE_SWAP,
    forbidden:
      HOOK_FLAGS.AFTER_SWAP |
      HOOK_FLAGS.BEFORE_ADD_LIQUIDITY |
      HOOK_FLAGS.AFTER_ADD_LIQUIDITY,
  },
  // Init-only — purely access control on pool creation.
  {
    family: "INIT_GATE",
    required: HOOK_FLAGS.BEFORE_INITIALIZE,
    forbidden:
      HOOK_FLAGS.BEFORE_SWAP |
      HOOK_FLAGS.AFTER_SWAP |
      HOOK_FLAGS.BEFORE_ADD_LIQUIDITY,
  },
];

export function classifyFamily(hookAddress: string): {
  family: HookFamily;
  bitmap: number;
  active: FlagName[];
} {
  const { bitmap, active } = decodeFlags(hookAddress);
  for (const p of PATTERNS) {
    const hasRequired = (bitmap & p.required) === p.required;
    const lacksForbidden = p.forbidden ? (bitmap & p.forbidden) === 0 : true;
    if (hasRequired && lacksForbidden) {
      return { family: p.family, bitmap, active };
    }
  }
  return { family: "UNKNOWN", bitmap, active };
}
