# Deploy LPDoctor contracts to 0G Galileo testnet

As of May 15, 2026, 0G's current public testnet is **Galileo**. Newton is
legacy/deprecated, so treat any old Newton deployment in this repo as
historical only and redeploy your own contracts on Galileo.

One-liner — deploy `LPDoctorReports` and `LPDoctorAgent` to Galileo testnet
(`chainId = 16602`):

```bash
cd contracts

# Required: a deployer key with at least a small amount of test 0G on Galileo
export WALLET_DEPLOYER_PK=0x...
export OG_GALILEO_RPC=https://evmrpc-testnet.0g.ai

# Optional: mint the agent iNFT in the same tx, with a code-image hash
# (32 bytes hex). Leave unset to skip the mint and call `LPDoctorAgent.mint`
# from the server later.
export LPDOCTOR_CODE_IMAGE_HASH=0x0000000000000000000000000000000000000000000000000000000000000000
export LPDOCTOR_METADATA_URI="og://lpdoctor-agent-v1.0.0"

forge script script/Deploy.s.sol \
  --rpc-url "$OG_GALILEO_RPC" \
  --broadcast \
  --legacy \
  --private-key "$WALLET_DEPLOYER_PK"
```

Forge prints the deployed addresses. Copy them into the project root `.env`:

```env
LPDOCTOR_REPORTS_CONTRACT=0x...
LPDOCTOR_AGENT_CONTRACT=0x...
```

Restart the server. From now on, phase 9 calls `LPDoctorReports.publishReport(tokenId, rootHash, attestation)` against the real registry, and the MCP tool `lpdoctor.lookupReportOnChain` resolves any anchored rootHash directly through `viem` against your contract — no LPDoctor API trust required.

## Verifying the deploy

```bash
# Pure on-chain read, independent of the LPDoctor server.
cast call $LPDOCTOR_REPORTS_CONTRACT \
  'reportCount(uint256)(uint256)' \
  $TOKEN_ID \
  --rpc-url "$OG_GALILEO_RPC"
```

If you anchored at least one report, the count goes up by one per call to `publishReport`.

## Galileo network details

- Chain name: `0G Galileo Testnet`
- RPC URL: `https://evmrpc-testnet.0g.ai`
- Chain ID: `16602`

This chain ID was verified directly against the live RPC
`https://evmrpc-testnet.0g.ai` via `eth_chainId` on May 15, 2026. Some
older 0G docs and community references still show `16601`; treat those
as stale.

## Re-deploying / migrating

The contracts use no proxies on purpose — the registry is append-only and the iNFT is non-upgradeable. To redeploy, change `LPDOCTOR_REPORTS_CONTRACT` / `LPDOCTOR_AGENT_CONTRACT` in `.env`; the old contracts stay on chain and remain queryable by their previous address.

## What if I don't have a deployer key?

Skip the deploy. The server's `ogChain` adapter falls back to a raw self-tx with the rootHash as calldata when `LPDOCTOR_REPORTS_CONTRACT` is empty — the rootHash still hits 0G Chain, just without the per-tokenId index. Panels label themselves accordingly so the demo is honest about what's contract-anchored vs raw-tx-anchored.
