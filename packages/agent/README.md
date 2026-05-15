# @lpdoctor/agent

`@lpdoctor/agent` contains the diagnostic pipeline that powers LP Doctor. It emits typed `DiagnosticEvent`s so the frontend can render a streamed, phase-by-phase experience.

## Current Phase Order

The public pipeline currently runs in this order:

1. `0` — preflight readiness
2. `1` — position resolution
3. `3` — impermanent loss reconstruction
4. `4` — regime classification
5. `5` — V4 hook discovery
6. `6` — hook scoring
7. `7` — migration preview
8. `10` — verdict synthesis
9. `8` — report assembly + storage upload
10. `9` — chain anchor + agent memory update

Phase `10` intentionally runs before `8` so the verdict lands inside the final report payload.

## Core Exports

The package exposes:

- `runPhase1`
- `runPhase3`
- `runPhase4`
- `runPhase5`
- `runPhase6`
- `runPhase7`
- `runPhase8`
- `runPhase9`
- `runPhase10`
- `assembleReport`
- supporting math / scoring / type utilities

## What The Package Computes

- V3 position resolution from subgraph data
- current token amounts
- IL and fee breakdown
- regime features and classification
- V4 hook family discovery
- hook scoring
- migration preview
- report payload assembly
- verdict prompt generation and validation

## Honesty Layer

Every meaningful output is wrapped in a label from `@lpdoctor/core`:

- `VERIFIED`
- `COMPUTED`
- `ESTIMATED`
- `EMULATED`
- `LABELED`

This keeps the report explicit about what is direct observation versus heuristic or simulation output.

## Tests

Current tests cover the most critical mathematical and integration surfaces, including:

- IL invariants
- IL calibration fixture
- integration subgraph diagnose against a live position
- on-chain report roundtrip

Run them with:

```bash
pnpm --filter @lpdoctor/agent test
```

## Relationship To The Server

`apps/server` wires real dependencies into this package:

- subgraph fetchers
- Trading API quote client
- 0G Storage uploader
- 0G Chain anchorer
- 0G Compute verdict synthesizer

This separation keeps the pipeline testable without tying the package directly to HTTP or Express concerns.
