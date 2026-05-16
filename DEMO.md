# LP Doctor Demo Walkthrough

This document is the judge-facing walkthrough for the current LP Doctor build. It is optimized for a short hackathon demo that highlights both product value and 0G integration.

- Frontend: `https://lpdoctor.vercel.app/`
- Backend: `https://lp-doctor-mainnet.up.railway.app`

## Suggested 3-Minute Demo Script

### 0:00 - 0:20 — Open with the problem

Start on the landing page and frame LP Doctor in one sentence:

> LP Doctor is a diagnostic copilot for Uniswap LPs. It explains why a position is underperforming, simulates V4 hook alternatives, and persists the result on the 0G stack.

### 0:20 - 0:50 — Show Atlas and the demo wallets

Open `/atlas`. Click one of the curated cartridges, ideally:

- `Bleeding` for a clear red-state story
- `Healthy` for contrast

Explain that these are real wallet addresses selected as fixtures, not mocked JSON. The frontend still fetches the position data from the live backend.

### 0:50 - 1:40 — Open a diagnose flow

Click a position card or go directly to:

- `/diagnose/605311`

Point out the streamed phases:

- position resolution
- IL reconstruction
- regime classification
- V4 hook discovery
- hook scoring
- migration preview
- verdict synthesis
- 0G Storage upload
- 0G Chain anchor + agent memory update

The important product point is that the user watches a real pipeline, not a spinner.

### 1:40 - 2:10 — Show the migration preview

Open the migration card and click the migrate CTA. Explain:

- the app builds a Permit2 migration bundle,
- the user signs,
- LP Doctor does not take custody or execute on the user's behalf.

### 2:10 - 2:40 — Show provenance

Stay on the diagnose page and highlight:

- `rootHash`
- `storageUrl`
- `anchor tx`
- verdict panel

Then open `/report/<rootHash>` and explain that the report is now:

- persisted,
- recoverable,
- and tied to the agent's on-chain memory.

### 2:40 - 3:00 — Show the agent identity page

Open `/agent` and show:

- `memoryRoot`
- `reputation`
- `migrationsTriggered`
- contract address and tokenId

Close by emphasizing that LP Doctor is not just a dashboard. It is a stateful agent workflow with persistence, anchoring, and on-chain memory.

## Backup Demo Paths

If Atlas is not convenient during a recording session, these direct paths are useful:

- `https://lpdoctor.vercel.app/diagnose/605311`
- `https://lpdoctor.vercel.app/agent`
- `https://lpdoctor.vercel.app/deck`

## Local Demo Commands

If you want to demo locally instead of using the hosted frontend:

```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm db:push
pnpm dev:server
pnpm dev:web
```

## Demo Wallets

| Scenario | Address |
| --- | --- |
| Portfolio | `0xfd235968e65b0990584585763f837a5b5330e6de` |
| Bleeding | `0x8f4daa33706d70677fd69e4e0d47e595bc820e95` |
| Mixed | `0x4d3e3d1a38505185ba86a1b1f3084195d556bc2a` |
| Whale | `0x4b296808f414ab3775889fa2863e1d73f958a58e` |
| Healthy | `0x90deceec188094f6f6c1ef446d843f70abfc92cb` |
| Drifting | `0x7c6ef14f6890d0fda17fb8e4fb6f649f0355c3be` |

## Judge Notes

- The current public deployment uses Ethereum mainnet data for Uniswap reads and 0G Aristotle Mainnet for the write path.
- If 0G signer keys are missing in a local setup, the write adapters fall back to deterministic stubs and the UI labels that output accordingly.
- The current build does **not** depend on ENS.
