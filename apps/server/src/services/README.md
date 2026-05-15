# Server Services

This folder holds the infrastructure adapters behind LP Doctor's backend.

## Files

| File | Responsibility |
| --- | --- |
| `subgraph.ts` | fetches Uniswap V3 / V4 data from The Graph |
| `tradingApi.ts` | wraps the Uniswap Trading API quote flow |
| `ogStorage.ts` | uploads assembled reports to 0G Storage |
| `ogChain.ts` | anchors reports and updates agent memory on 0G Chain |
| `ogCompute.ts` | synthesizes final verdicts via 0G Compute |
| `reportCache.ts` | keeps public report data addressable by `rootHash` |
| `v4Aggregator.ts` | derives V4 position views from raw modify-liquidity events |
| `v4PositionManager.ts` | reads supplemental V4 position-manager info |

## Service Responsibilities In The Diagnose Flow

### `subgraph.ts`

Used by:

- `/api/positions/:address`
- `/api/positions/v4/:address`
- phase `1`
- phase `4`
- phase `5`
- phase `6`

It is the primary read-path for live Uniswap data.

### `tradingApi.ts`

Used in phase `7` to turn a migration preview into a realistic quote rather than a purely hypothetical swap.

### `ogCompute.ts`

Used in phase `10`. It takes the assembled structured report draft and asks a 0G Compute provider to produce the final verdict text. When the compute adapter is not fully configured, it falls back to a deterministic stub and the UI labels that honestly.

### `ogStorage.ts`

Used in phase `8`. It uploads the report payload and returns:

- `rootHash`
- `storageUrl`
- optional transaction metadata

### `ogChain.ts`

Used in phase `9` for:

- anchoring the `rootHash` through `LPDoctorReports`
- updating `LPDoctorAgent.memoryRoot`
- incrementing diagnose reputation
- recording migration digests from `/api/migrate/:tokenId/recorded`

### `reportCache.ts`

Bridges the SSE flow and the report page. The cache is written as soon as phase `8` finishes so `/api/report/:rootHash` works immediately, then updated again after phase `9` adds anchor metadata.
