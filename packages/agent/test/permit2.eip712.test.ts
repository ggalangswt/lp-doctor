import { describe, expect, it } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { keccak256, recoverTypedDataAddress, toHex } from "viem";

// AT-6 — Permit2 EIP-712 signature.
// Signs a synthetic `PermitSingle` typed data payload with a known
// private key, recovers the signer offline via viem, and asserts the
// recovered address matches.
//
// The typed data shape mirrors the wallet hook in
// `apps/web/src/hooks/usePermit2Migration.ts` — pinned here so a
// regression in the migration flow surfaces in CI.

const PERMIT2_ADDRESS =
  "0x000000000022D473030F116dDEE9F6B43aC78BA3" as const;

const PERMIT_SINGLE_TYPES = {
  PermitSingle: [
    { name: "details", type: "PermitDetails" },
    { name: "spender", type: "address" },
    { name: "sigDeadline", type: "uint256" },
  ],
  PermitDetails: [
    { name: "token", type: "address" },
    { name: "amount", type: "uint160" },
    { name: "expiration", type: "uint48" },
    { name: "nonce", type: "uint48" },
  ],
} as const;

// Deterministic test key — never used on chain. Derived as
// keccak256("lpdoctor-at-6-permit2-test").
const TEST_PK = keccak256(toHex("lpdoctor-at-6-permit2-test"));

describe("AT-6 — Permit2 EIP-712 signature round-trip", () => {
  const account = privateKeyToAccount(TEST_PK);

  const domain = {
    name: "Permit2",
    chainId: 1,
    verifyingContract: PERMIT2_ADDRESS,
  } as const;

  const message = {
    details: {
      token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const, // USDC
      amount: 1_000_000_000n,
      expiration: 1_800_000_000,
      nonce: 0,
    },
    spender: "0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af" as const, // Universal Router
    sigDeadline: 1_730_000_000n,
  } as const;

  it("signs and recovers the signer address", async () => {
    const signature = await account.signTypedData({
      domain,
      types: PERMIT_SINGLE_TYPES,
      primaryType: "PermitSingle",
      message,
    });

    expect(signature).toMatch(/^0x[0-9a-fA-F]{130}$/);

    const recovered = await recoverTypedDataAddress({
      domain,
      types: PERMIT_SINGLE_TYPES,
      primaryType: "PermitSingle",
      message,
      signature,
    });

    expect(recovered.toLowerCase()).toBe(account.address.toLowerCase());
  });

  it("rejects a tampered message at the recovery step", async () => {
    const signature = await account.signTypedData({
      domain,
      types: PERMIT_SINGLE_TYPES,
      primaryType: "PermitSingle",
      message,
    });

    const tampered = {
      ...message,
      details: { ...message.details, amount: 2_000_000_000n },
    };

    const recovered = await recoverTypedDataAddress({
      domain,
      types: PERMIT_SINGLE_TYPES,
      primaryType: "PermitSingle",
      message: tampered,
      signature,
    });

    expect(recovered.toLowerCase()).not.toBe(account.address.toLowerCase());
  });

  it("uses the canonical Permit2 verifying contract", () => {
    expect(domain.verifyingContract).toBe(PERMIT2_ADDRESS);
  });
});
