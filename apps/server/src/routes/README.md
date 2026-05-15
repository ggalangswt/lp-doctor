# Server Routes

This folder contains the user-facing HTTP entry points that power LP Doctor.

## Active Routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/health` | `GET` | readiness and dependency summary |
| `/api/positions/:address` | `GET` | fetch V3 LP positions for a wallet |
| `/api/positions/v4/:address` | `GET` | derive V4 positions from modify-liquidity events |
| `/api/positions/v4/:tokenId/info` | `GET` | V4 position manager read helper |
| `/api/diagnose/:tokenId` | `GET` | streamed diagnose pipeline over SSE |
| `/api/migrate/:tokenId/recorded` | `POST` | record a signed migration digest on the agent contract |
| `/api/report/:rootHash` | `GET` | fetch cached report data by root hash |

## `/api/diagnose/:tokenId`

This is the core product route. It streams typed `DiagnosticEvent` frames over `text/event-stream`.

### Event types used by the frontend

- `phase.start`
- `phase.end`
- `tool.call`
- `tool.result`
- `narrative`
- `verdict.final`
- `report.uploaded`
- `report.anchored`
- `error`

### Current phase order

The route emits:

- phase `0`: preflight
- phase `1`: position resolution
- phase `3`: IL
- phase `4`: regime
- phase `5`: hook discovery
- phase `6`: hook scoring
- phase `7`: migration preview
- phase `10`: verdict synthesis
- phase `8`: report assembly + storage
- phase `9`: chain anchor + memory update

### Quick test

```bash
curl -N http://localhost:3001/api/diagnose/605311
```

## `/api/migrate/:tokenId/recorded`

Accepts a Permit2-typed signature payload from the frontend after the user signs. The route verifies the signer and records the digest on `LPDoctorAgent.recordMigration`.

## `/api/report/:rootHash`

Returns the cached public report shape used by the report page. The cache is filled during phase `8`, then enriched with anchor metadata after phase `9`.
