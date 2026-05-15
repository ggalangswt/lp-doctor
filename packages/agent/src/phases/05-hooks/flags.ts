// Decode V4 hook permission flags from the lowest 14 bits of a hook
// contract address (verified against Uniswap/v4-core/main/src/libraries/Hooks.sol).
// See data/uniswap-v4-hooks.md (research notes) for the bit layout.

export const HOOK_FLAGS = {
  BEFORE_INITIALIZE: 1 << 13,
  AFTER_INITIALIZE: 1 << 12,
  BEFORE_ADD_LIQUIDITY: 1 << 11,
  AFTER_ADD_LIQUIDITY: 1 << 10,
  BEFORE_REMOVE_LIQUIDITY: 1 << 9,
  AFTER_REMOVE_LIQUIDITY: 1 << 8,
  BEFORE_SWAP: 1 << 7,
  AFTER_SWAP: 1 << 6,
  BEFORE_DONATE: 1 << 5,
  AFTER_DONATE: 1 << 4,
  BEFORE_SWAP_RETURNS_DELTA: 1 << 3,
  AFTER_SWAP_RETURNS_DELTA: 1 << 2,
  AFTER_ADD_LIQUIDITY_RETURNS_DELTA: 1 << 1,
  AFTER_REMOVE_LIQUIDITY_RETURNS_DELTA: 1 << 0,
} as const;

export type FlagName = keyof typeof HOOK_FLAGS;

const ALL_HOOK_MASK = (1 << 14) - 1;

export function decodeFlags(hookAddress: string): {
  bitmap: number;
  active: FlagName[];
} {
  const lo = Number(BigInt(hookAddress) & BigInt(ALL_HOOK_MASK));
  const active: FlagName[] = [];
  for (const k of Object.keys(HOOK_FLAGS) as FlagName[]) {
    if ((lo & HOOK_FLAGS[k]) !== 0) active.push(k);
  }
  return { bitmap: lo, active };
}
