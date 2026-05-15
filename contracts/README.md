# LPDoctor Contracts

Solidity 0.8.24, Foundry. For current testing, target **0G Galileo testnet**
(`chainId = 16602`, RPC `https://evmrpc-testnet.0g.ai`). Older Newton
references in this repo are legacy.

## Layout

| Path | Purpose |
| --- | --- |
| `src/LPDoctorReports.sol` | Append-only registry mapping report rootHash → publisher + timestamp + tokenId. Anchors phase 8 storage uploads on chain. |
| `src/LPDoctorAgent.sol` | ERC-7857-style iNFT for the LPDoctor agent itself. Stores agent metadata + persistent memory rootHash + reputation counter. Ownership grants royalty share over MCP usage. |
| `src/LPDoctorTEEVerifier.sol` | Verifies the TEE attestation signature attached to each report. Allows on-chain assertion that a report was signed by an enclave whose code-hash matches our published Docker image. |
| `script/Deploy.s.sol` | Deploys `LPDoctorReports` and `LPDoctorAgent` to the active target RPC. |
| `test/*.t.sol` | Foundry unit tests covering the registry append, iNFT mint + memory update, attestation signature happy-path. |

## Build + test

```bash
cd contracts
forge build
forge test -vv
```

## Deploy (0G Galileo testnet)

```bash
export OG_GALILEO_RPC=https://evmrpc-testnet.0g.ai
export WALLET_DEPLOYER_PK=0x...

forge script script/Deploy.s.sol \
  --rpc-url $OG_GALILEO_RPC \
  --broadcast \
  --legacy \
  --private-key $WALLET_DEPLOYER_PK
```

After deploy, copy the addresses from `deployments/newton.json` into
the project root `.env` as `LPDOCTOR_REPORTS_CONTRACT`,
`LPDOCTOR_AGENT_CONTRACT`, `LPDOCTOR_TEE_VERIFIER_CONTRACT`. The server's
`ogChain` adapter switches from raw tx-data anchoring to a contract
`publishReport` call once `LPDOCTOR_REPORTS_CONTRACT` is set.

## Sources of truth

- ERC-7857 (iNFT) draft — modeled on the Alpha Dawg reference impl
  with the licensing + memory-hash extensions.
- 0G's current public testnet is Galileo. Official 0G docs and 0G's
  April 23, 2025 announcement say Galileo is a clean replacement for
  Newton and contracts should be redeployed there.
- The live Galileo RPC `https://evmrpc-testnet.0g.ai` returned
  `eth_chainId = 0x40da` on May 15, 2026, i.e. `16602`. If you see
  `16601` in older guides, prefer the RPC truth.
- `viem` is fine for read paths but `ethers` v6 still needs the
  `EnsPlugin` zero-resolver hack on 0G Chain — the `Deploy.s.sol`
  script avoids that path by using Forge's native cheatcodes.
