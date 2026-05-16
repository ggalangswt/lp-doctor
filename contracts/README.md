# LPDoctor Contracts

Solidity 0.8.24, Foundry. The live deployment target is **0G Mainnet**
(`chainId = 16661`, RPC `https://evmrpc.0g.ai`). Older Galileo / Newton
references in the repo are historical.

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

## Deploy (0G Mainnet)

```bash
export OG_GALILEO_RPC=https://evmrpc.0g.ai
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
- The live 0G Mainnet RPC `https://evmrpc.0g.ai` returns
  `eth_chainId = 16661`. If you see old Galileo / Newton values in
  historical docs, prefer the RPC truth.
- `viem` is fine for read paths, but for contract deployment we still
  prefer Foundry's native cheatcodes over ad-hoc runtime RPC plumbing.
