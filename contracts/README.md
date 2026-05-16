# LPDoctor Contracts

Solidity 0.8.24, Foundry. The live deployment target is **0G Aristotle Mainnet**
(`chainId = 16661`, RPC `https://evmrpc.0g.ai`). Older Galileo / Newton
references in the repo are historical only.

## Layout

| Path | Purpose |
| --- | --- |
| `src/LPDoctorReports.sol` | Append-only registry mapping report rootHash → publisher + timestamp + tokenId. Anchors phase 8 storage uploads on chain. |
| `src/LPDoctorAgent.sol` | ERC-7857-style iNFT for the LPDoctor agent itself. Stores agent metadata + persistent memory rootHash + reputation counter. Ownership grants royalty share over MCP usage. |
| `script/Deploy.s.sol` | Deploys `LPDoctorReports` and `LPDoctorAgent` to the active target RPC. |
| `test/*.t.sol` | Foundry unit tests covering the registry append and iNFT mint + memory update flows. |

## Build + test

```bash
cd contracts
forge build
forge test -vv
```

## Deploy (0G Aristotle Mainnet)

```bash
export OG_GALILEO_RPC=https://evmrpc.0g.ai
export WALLET_DEPLOYER_PK=0x...

forge script script/Deploy.s.sol \
  --rpc-url $OG_GALILEO_RPC \
  --broadcast \
  --legacy \
  --private-key $WALLET_DEPLOYER_PK
```

After deploy, copy the addresses into the project root `.env` as
`LPDOCTOR_REPORTS_CONTRACT` and `LPDOCTOR_AGENT_CONTRACT`. The server's
`ogChain` adapter uses `publishReport` and `updateMemoryRoot` against those
contracts once the env is set.

The current live mainnet deployment is:

- `LPDoctorReports`: `0x23Ce8A133B96a0186B8f2cB547553DfF00a3CBd7`
- `LPDoctorAgent`: `0xE9446bC93d430e431F204611206B11633aD96F94`
- `tokenId`: `1`

## Sources of truth

- ERC-7857 (iNFT) draft — modeled on the Alpha Dawg reference impl
  with the licensing + memory-hash extensions.
- The live 0G Aristotle Mainnet RPC `https://evmrpc.0g.ai` returns
  `eth_chainId = 16661`. If you see old Galileo / Newton values in
  historical docs, prefer the RPC truth.
- `viem` is fine for read paths, but for contract deployment we still
  prefer Foundry's native cheatcodes over ad-hoc runtime RPC plumbing.
