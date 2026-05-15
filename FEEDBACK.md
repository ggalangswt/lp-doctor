# Feedback on Uniswap Developer Tooling

This note summarizes what worked well and what created friction while building LP Doctor against Uniswap developer infrastructure during the 0G APAC Hackathon 2026.

## What We Used

- Uniswap V3 subgraph
- Uniswap V4 subgraph
- Uniswap Trading API
- Permit2 typed-data flow
- `@uniswap/v3-sdk` math utilities for IL reconstruction

## What Worked Well

### Trading API

The Trading API was useful for turning migration previews into a concrete product surface. We could request a quote for the swap leg and present a realistic route, price impact estimate, and gas estimate inside the migration preview without building our own router abstraction.

### V3 subgraph

The V3 data plane was good enough to power the LP Atlas and diagnosis flow:

- owner-based position lookup
- token pair context
- current pool tick
- per-position deposits and collected fees
- hourly pool data for regime classification

This was the backbone of the read-path and made it possible to ship a real product quickly.

### Permit2

Permit2 gave us a clean UX boundary. LP Doctor can produce a typed migration bundle and keep the user in custody, instead of pretending to be an execution bot. That split is important for product trust.

## Friction Points

### V4 discovery still needs more ergonomic developer surfaces

The V4 exploration path is possible today, but it still feels like builder-grade plumbing rather than application-grade primitives. Hook discovery, family classification, and readable metadata all require extra logic on the application side.

### Trading API is great for previewing, but the product boundary is still manual

The quote response is good for preview UX, but turning that into a polished migration flow still requires app-specific orchestration. For agent workflows, more opinionated examples around preview-to-signature pipelines would be helpful.

### Historical reasoning requires builders to compose multiple sources

LP Doctor combines current position state, historical pool data, V4 hook discovery, and migration simulation. That composition is possible, but it still falls on the product team to stitch together a coherent reasoning pipeline.

## Feature Requests

### 1. More application-friendly V4 discovery surfaces

A higher-level V4 discovery layer would help builders answer questions like:

- which hooks are active for this pair,
- which pools are meaningful by TVL and volume,
- which hooks are realistically worth comparing.

### 2. Better examples for route preview -> user signature flows

A practical TypeScript example showing how to go from quote generation to a user-facing signing flow would lower the integration burden for products that want to stay non-custodial.

### 3. Better "demo wallet" references in docs

Curated example wallets and positions would help teams building analytics and risk interfaces. During a hackathon, that saves a lot of time.

## Final Note

Overall, the Uniswap stack was strong enough for us to build a serious LP diagnostic product, not just a toy integration. The biggest opportunity now is smoothing the path from raw protocol primitives to agent-friendly application workflows.
