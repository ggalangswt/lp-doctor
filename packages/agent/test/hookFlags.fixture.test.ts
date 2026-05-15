import { describe, expect, it } from "vitest";
import { decodeFlags, HOOK_FLAGS } from "../src/phases/05-hooks/flags.js";
import { classifyFamily } from "../src/phases/05-hooks/classify.js";

// AT-9 — V4 hook flag bitmap decoding fixture.
// Asserts that the 14-bit flag bitmap baked into the lower bits of a
// hook contract address decodes to the masking the PoolManager
// expects, and that the family classifier produces the right label
// for canonical V4 mainnet hook patterns.
//
// Source: Uniswap/v4-core/main/src/libraries/Hooks.sol (verified in
// data/uniswap-v4-hooks.md research notes).

// Synthetic address shaped so the lowest 14 bits encode the desired
// permission set. Higher bits are zero — the on-chain check only
// reads the lowest 14 bits.
function addressFromBits(bits: number): string {
  const hex = bits.toString(16).padStart(40, "0");
  return `0x${hex}`;
}

describe("AT-9 — hook flag bitmap decoding", () => {
  it("decodes the all-on bitmap and lists every flag", () => {
    const all = (1 << 14) - 1;
    const addr = addressFromBits(all);
    const { bitmap, active } = decodeFlags(addr);
    expect(bitmap).toBe(all);
    expect(active.length).toBe(14);
  });

  it("decodes the all-off bitmap and lists no flags", () => {
    const addr = addressFromBits(0);
    const { bitmap, active } = decodeFlags(addr);
    expect(bitmap).toBe(0);
    expect(active.length).toBe(0);
  });

  it("ignores high bits — only the lowest 14 bits matter", () => {
    // 0xfff…000 0001 — every high bit on, only BEFORE_INITIALIZE on low.
    const addr =
      "0xffffffffffffffffffffffffffffffff0000" +
      HOOK_FLAGS.BEFORE_INITIALIZE.toString(16).padStart(4, "0");
    const { bitmap, active } = decodeFlags(addr);
    expect(bitmap).toBe(HOOK_FLAGS.BEFORE_INITIALIZE);
    expect(active).toEqual(["BEFORE_INITIALIZE"]);
  });

  it("classifies a dynamic-fee-advanced hook bitmap", () => {
    const bits =
      HOOK_FLAGS.BEFORE_INITIALIZE |
      HOOK_FLAGS.AFTER_INITIALIZE |
      HOOK_FLAGS.BEFORE_SWAP |
      HOOK_FLAGS.AFTER_SWAP |
      HOOK_FLAGS.AFTER_SWAP_RETURNS_DELTA;
    const addr = addressFromBits(bits);
    const { family, bitmap, active } = classifyFamily(addr);
    expect(family).toBe("DYNAMIC_FEE_ADVANCED");
    expect(bitmap).toBe(bits);
    expect(active).toContain("AFTER_SWAP_RETURNS_DELTA");
  });

  it("classifies a swap-delta-cut hook (no init flags)", () => {
    const bits =
      HOOK_FLAGS.BEFORE_SWAP |
      HOOK_FLAGS.AFTER_SWAP |
      HOOK_FLAGS.AFTER_SWAP_RETURNS_DELTA;
    const addr = addressFromBits(bits);
    expect(classifyFamily(addr).family).toBe("SWAP_DELTA_CUT");
  });

  it("classifies a gated-swap hook (init + before_swap only)", () => {
    const bits = HOOK_FLAGS.BEFORE_INITIALIZE | HOOK_FLAGS.BEFORE_SWAP;
    const addr = addressFromBits(bits);
    expect(classifyFamily(addr).family).toBe("GATED_SWAP");
  });

  it("classifies an init-gate hook (before_initialize only)", () => {
    const bits = HOOK_FLAGS.BEFORE_INITIALIZE;
    const addr = addressFromBits(bits);
    expect(classifyFamily(addr).family).toBe("INIT_GATE");
  });

  it("falls back to UNKNOWN for an unrecognized pattern", () => {
    // Just AFTER_DONATE — none of the seven patterns match.
    const bits = HOOK_FLAGS.AFTER_DONATE;
    const addr = addressFromBits(bits);
    expect(classifyFamily(addr).family).toBe("UNKNOWN");
  });
});
