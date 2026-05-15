# LP Doctor Product Context

## Purpose

LP Doctor is an autonomous diagnostic agent for Uniswap V3 and V4 liquidity providers. It explains why an LP position is bleeding, reconstructs impermanent loss from the tick range, replays candidate V4 hooks against real swap history, proposes a migration path, and produces a verifiable report that can be checked without trusting the LP Doctor server.

The product is not a generic portfolio dashboard. It is a forensic instrument for DeFi LPs: fast enough for a hackathon demo, technical enough for protocol engineers, and credible enough that every claim can point to data, labels, signatures, hashes, or chain records.

## Register

LP Doctor is a dual-register product. Register determines how much decorative energy a surface carries.

| Surface | Register | Design priority |
|---|---|---|
| Landing | Brand | Design IS the product story. Loud, poster-like, memorable. |
| Atlas | Product | Design SERVES the scanner. Legibility, density, scan hierarchy. |
| Diagnose | Product | Design SERVES the live process. Confidence, readability, state clarity. |
| Report | Product | Design SERVES the proof artifact. Archival, exportable, trustworthy. |
| Header / Nav | Shared | Identity anchor that works across both registers. |

All surfaces share the same visual language and token system. The difference is intensity and decoration budget. Brand register can spend more. Product register spends less, but spends deliberately.

When impeccable is invoked on a specific page, use the register column above to determine the reference. Do not apply brand-register intensity to product-register pages.

## Core Positioning

LP Doctor is the tool you open when a Uniswap LP position looks fine on a dashboard but is quietly losing money underneath.

It does three things that adjacent tools do not combine:

- Diagnoses the position at the LP NFT level.
- Simulates V4 hook alternatives against swap history instead of guessing.
- Publishes a signed, verifiable report through 0G Storage, 0G Chain, ENS records, and an agent identity layer.

The message should stay sharp:

- "See why your LP is bleeding."
- "No spinner, no black box."
- "Every number carries an honesty label."
- "The agent diagnoses. The user keeps custody."
- "A report, not a screenshot."
- "Five verification paths, one rootHash."

## Audience

Primary users:

- Uniswap V3 LPs who need to understand whether their position is healthy, drifting, or bleeding.
- DeFi power users who can read token IDs, ticks, fee tiers, and pool ranges.
- 0G APAC Hackathon 2026 judges evaluating 0G network integration depth, agent economy, verifiability, and Uniswap hook simulation.
- Protocol builders who care about V4 hooks, swap replay, TEE execution, MCP tools, and signed agent output.

Secondary users:

- DAOs reviewing LP performance reports.
- Other agents or agent frameworks calling LP Doctor through MCP.
- Developers evaluating the report registry, ENS provenance, and 0G anchoring path.

The site should assume technical literacy, but not punish users who are skimming. The best version feels expert, compressed, and legible.

## Product Truths

- LP Doctor is diagnostic first. It does not custody funds.
- It proposes migrations, but user signatures stay in the user's wallet.
- Verification is a public good. Lookup and verification paths should feel open and inspectable.
- The honesty layer matters. VERIFIED, COMPUTED, ESTIMATED, EMULATED, and LABELED are product language, not decoration.
- TEE and 0G should read as evidence, not buzzwords.
- The agent's output should feel signed, anchored, forwardable, and durable.
- The UI should make live progress visible. Streams, phases, tool calls, and labels are part of the trust story.
- The product is hackathon-native, but it should not feel disposable.

## Desired Brand Feeling

Neo-Y2K Cyber Arcade Hackathon.

The visual world should feel like a serious DeFi diagnostic tool wearing the energy of a late-night hackathon poster: retro browser chrome, pixel UI details, hard shadows, wireframe grids, sticker badges, floating diagnostic windows, score counters, terminal streams, and electric color.

It should feel:

- Fast.
- Verifiable.
- Competitive.
- Slightly chaotic, but controlled.
- Playful at the surface, serious underneath.
- Built by DeFi hackers for DeFi hackers.
- More like a working cyber arcade instrument than a corporate SaaS page.

The chaotic energy is a budget, not a requirement. Landing spends the full budget. App surfaces spend it on chrome details, type contrast, and state indicators, not on composition noise. Report spends almost none of it on decoration, but still reads as part of the same system through shared tokens and component style.

It should not feel:

- Generic dark DeFi dashboard.
- Corporate AI SaaS landing page.
- Beige startup template.
- Navy fintech deck.
- Glassy cyberpunk wallpaper.
- Minimalism with no product evidence.
- A random collection of neon effects.

## Physical Scene

These scenes anchor theme and register decisions. Invoke the scene that matches the surface being designed.

**Landing (brand register):** A DeFi hacker stumbles onto LP Doctor during 0G APAC Hackathon 2026 submissions. They have 30 seconds to decide if it is worth opening. The page should hit like a hackathon poster: fast, electric, credible. They should understand the product immediately and feel invited to run a diagnosis.

**Atlas (product register):** A power user has connected their wallet and is scanning ten open positions. The room is quiet, the monitor is bright, and they are looking for anything bleeding or near-edge. The interface should scan cleanly and surface health state without ceremony.

**Diagnose (product register):** A DeFi engineer has submitted a tokenId and is watching the agent work in real time. Every phase, tool call, and label carries weight. The user is waiting and watching. The interface must make progress, state, and honesty visible without distraction.

**Report (product register):** A DAO contributor is reviewing a report received from another LP. They do not know the original context. They need to verify every claim. The interface should feel like a signed document: calm, complete, inspectable, and forwardable.

**Shared rule:** The product is not dark just because DeFi is often dark. It is bright, electric, and legible because it is a public proof object, a hackathon artifact, and a diagnostic console. App surfaces are calmer than the landing, but still carry the Neo-Y2K energy through type, borders, and component chrome.

## Visual Direction

Use a Neo-Y2K Cyber Arcade system:

- Light purple-tinted base surfaces.
- Electric purple as dominant identity color.
- Hot magenta for urgency, heat, motion, and active states.
- Cobalt blue for verification, trust, links, and chain provenance.
- Neon yellow for primary calls to action and attention-critical signals only.
- Red-orange for bleed and loss.
- Green for healthy states.
- Yellow or toxic gold for drift, warning, and uncertainty.

Prefer OKLCH color tokens for new design work. Do not use pure black or pure white. Neutrals should be tinted toward the brand hue.

The design language should include:

- Browser chrome windows with compact title bars.
- Pixel buttons, pixel cursors, and hard-edged affordances.
- Wireframe perspective grids.
- Diagonal stickers and small rotated badges.
- Hard shadows with little or no blur.
- Mono diagnostic streams.
- Scoreboard counters and stage labels.
- Layered panels that feel intentionally collaged.
- Tables and reports that still scan cleanly.

The design should avoid:

- Gradient text.
- Decorative glassmorphism.
- Side-stripe card accents.
- Identical icon-card grids.
- The hero-metric template.
- Over-rounded SaaS cards.
- Purple fog with no information structure.
- Decorative effects that obscure hashes, labels, amounts, or report data.

## Tone And Copy

Tone should be concise, diagnostic, and direct. Use short claims that sound like a tool speaking under pressure.

Good copy patterns:

- "Your LP is bleeding."
- "Replay the pool. Score the hook. Anchor the report."
- "The agent diagnoses. You sign."
- "No LP Doctor server in the trust path."
- "Every phase is visible."
- "Same rootHash, five ways to verify."
- "Built for positions that dashboards flatten."

Avoid:

- Generic value props like "unlock insights" or "supercharge liquidity."
- Over-explaining the obvious.
- Corporate optimism.
- Overuse of "AI-powered."
- Claims that cannot be tied to a phase, report field, hash, signature, or on-chain record.

Use punctuation cleanly. Prefer periods, commas, colons, and parentheses. Avoid em dashes in UI copy.

## Information Architecture

Existing pages and routes should be preserved during redesigns. Do not remove pages, routes, or product flows unless explicitly asked.

Known website surfaces:

- Landing: campaign page for the product, agent, verification story, and hackathon positioning.
- Atlas: wallet-level LP position browser with demo wallets, aggregate stats, health states, and position cards.
- Diagnose: live SSE stream for a tokenId, showing tool calls, narrative, IL, regime, hooks, scoring, migration preview, provenance, verdict, and ENS publication.
- Report: durable report viewer by rootHash with provenance and payload sections.
- Header and navigation: shared shell that should support both campaign and app modes.
- Shared panels: labels, badges, health chips, position cards, migration panels, provenance panels, verdict panels, hook panels, and report sections.

Redesigns should keep these pages and flows intact. They may change layout, hierarchy, visual treatment, component style, and motion, but should not change the product's route structure or remove core content.

## Page-Level Direction

### Landing

Landing is the loudest surface. It should feel like an interactive hackathon poster.

Use:

- Oversized condensed display typography.
- A light base with electric purple and magenta energy.
- Wireframe perspective grid or arcade-stage composition.
- Floating diagnostic windows.
- Browser chrome title bars.
- Sticker badges for status, testnet, TEE, and hackathon context.
- Pixel cursor motifs.
- A strong CTA row.
- A ticker or score-counter treatment for stats.

Landing may be maximalist, but the product message must stay legible. The visitor should understand in seconds: LP Doctor diagnoses Uniswap LP bleed, runs visible phases, simulates migration, and publishes verifiable reports.

### Atlas

Atlas is an app surface, not a poster. It should feel like a wallet scanner or arcade control board.

Use:

- Clear wallet input.
- Demo wallet chips that feel tactile and distinct.
- Aggregate stats as scoreboard modules.
- Position cards with visible health states.
- Strong scan hierarchy for pair, tokenId, range, fee tier, liquidity, fees, and action.

Keep density useful. Do not bury the user's positions under decoration.

### Diagnose

Diagnose is the live operating room. It should make time, state, and evidence visible.

Use:

- A clear page title with tokenId and stream status.
- Phase progression or tool-call stream with terminal energy.
- Honest labels attached to panels.
- Side rail for live narrative and tool calls.
- Main column for evidence panels.
- Visual distinction between pending, ready, errored, emulated, estimated, and verified states.

This page may use arcade chrome, but should prioritize confidence and readability. The user is watching a real process.

### Report

Report is the proof artifact. It should feel calmer and more archival than the landing page.

Use:

- RootHash and provenance as first-class objects.
- Dense mono rows for hashes and numeric data.
- Clear sectioning for position, IL, regime, hooks, migration, and warnings.
- Verification labels that are visually consistent with Diagnose.
- Link styles that make external verification obvious.

Reports should feel exportable and forwardable to another human or DAO.

### Header And Navigation

The header should be a shared identity anchor.

Use:

- Compact browser-bar or command-bar feeling.
- LP Doctor logo and version tag.
- Nav that can work on both light campaign surfaces and denser app pages.
- 0G Compute TEE attestation as a credible status chip.
- Wallet connect action with strong but not distracting treatment.

The header should not look like a generic SaaS navbar.

## Component Direction

### Buttons

Primary buttons should feel like arcade controls:

- Neon yellow or electric purple, depending on context.
- Hard shadow on hover.
- Minimal radius, often 0 to 4px.
- Clear active and disabled states.
- Icons or arrows only when they clarify action.

Secondary buttons should use borders, magenta or cobalt accents, and restrained background fills.

### Panels And Cards

Prefer "window panels" over generic cards.

Window panels can include:

- 2px border.
- Compact title bar.
- Three small pixel buttons.
- Mono caption.
- Hard shadow.
- Square or near-square corners.

Cards should not all be identical. Vary layout, scale, index placement, and content rhythm. Avoid nested cards.

### Tables

Tables should feel like verification matrices:

- Strong gridlines or pixel borders.
- Sticky or high-contrast headers where useful.
- Mono values for hashes, token IDs, and amounts.
- Cobalt for verification links.
- Neon yellow only for key winning or primary action cells.

Tables must remain usable on mobile through horizontal scroll or thoughtful stacking.

### Forms

Inputs should feel like command fields:

- Mono text for wallet addresses, hashes, and token IDs.
- Clear focus ring in purple, magenta, or cobalt.
- Helpful placeholder copy.
- Inline error states with direct language.

### Status And Health

Health states are core product language:

- Healthy: green, stable, in range.
- Drifting: warning yellow or toxic gold, close to edge.
- Bleeding: red-orange, urgent, migrate recommended.
- Verified: cobalt or green depending on context.
- Computed: cobalt or purple.
- Estimated: yellow or violet.
- Emulated: muted warning.
- Labeled: purple.

Do not let color be the only indicator. Pair color with text labels, icons, or structural treatment.

### Badges And Stickers

Badges are small, high-signal objects. Two roles: status chips and sticker labels.

Status chips (inline, small):

- Use for health states, honesty labels (VERIFIED, COMPUTED, ESTIMATED, EMULATED, LABELED), and provenance signals.
- Sharp corners, 1px border, no fill or restrained fill, mono text, uppercase.
- Pair with color: cobalt for verified, purple for computed/labeled, yellow for estimated, muted for emulated.
- Never let color be the only signal. Text label is required.

Sticker labels (decorative, rotated):

- Use sparingly on brand surfaces for hackathon context, testnet status, version, and TEE attestation.
- Slight rotation (2 to 5 degrees), bold text, high-contrast fill, hard shadow.
- Not for product-critical data. Do not rotate verification labels, health states, or report data.

### Links

Links that point to external verification (Etherscan, 0G Explorer, IPFS, ENS) should feel explicitly actionable:

- Cobalt color with visible underline or arrow glyph.
- Do not camouflage verification links as plain text.
- On Report surfaces, every hash or address that is verifiable externally should carry a clear link affordance.
- On Diagnose surfaces, provenance links in panels should be visually consistent with Report.

Internal navigation links (page-to-page) follow standard nav treatment and should not compete with verification links.

### Empty, Loading, And Error States

These states are part of the product's trust story, not afterthoughts.

Empty states:

- Wallet not connected: direct prompt to connect or use demo wallet. Use arcade chrome container.
- No positions found: state it plainly. Offer demo wallet link. No generic empty illustrations.
- Report not found: show the rootHash that was queried, state it is not in the registry, offer an IPFS or 0G fallback lookup.

Loading states:

- Use visible phase language during SSE streams on Diagnose. Do not show generic spinners.
- Atlas position loading: skeleton rows with clear pulse. Maintain layout so no layout shift when data arrives.
- Report loading: show rootHash immediately, load sections progressively.

Error states:

- Inline, direct language. No apology tone. "Position not found for tokenId X." not "Oops, something went wrong."
- Always surface what failed and what the user can do. If a tool call fails on Diagnose, show which tool failed and the phase it was in.
- Error colors: red-orange border and label. Do not use full red-orange background fills on app surfaces.

### Motion

Motion should support instrument feedback:

- Phase rows entering as events arrive.
- Ticker or score counter on campaign surfaces.
- Window panels lifting by a few pixels on hover.
- Hard-shadow shifts.
- Subtle grid drift.
- Cursor or caret blink for terminal streams.

Avoid bounce, elastic motion, and layout-janky animations. Respect reduced motion.

## Typography

Use a high-contrast type system:

- Condensed display face for campaign headlines and major section titles.
- Clean sans for body and product UI.
- Mono for addresses, hashes, token IDs, tool names, events, chain IDs, and numeric report rows.

Recommended direction:

- Display: Barlow Condensed or another compressed technical display face. Must be narrow, high-contrast, and legible at large sizes. Space Grotesk is not a display face and should not be used here.
- Sans: Inter, Space Grotesk, or an equivalent neutral UI sans.
- Mono: JetBrains Mono, Geist Mono, or equivalent.

Hero text can be huge. App text should be compact and precise. Avoid negative tracking that harms readability. Keep body text to 65 to 75 characters per line where possible.

## Layout Principles

- Landing can use layered collage composition.
- App pages should use structured grids and clear columns.
- Use asymmetry intentionally, especially on brand surfaces.
- Let report and diagnostic data breathe.
- Use full-width bands where they clarify section changes.
- Do not wrap every section in a floating card.
- Avoid nested card structures.
- Keep mobile layouts decisive: stack, simplify, and keep primary action visible.

## Accessibility And Legibility

- Maintain strong contrast for body copy, labels, form fields, and report rows.
- Ensure health colors have text labels.
- Keep focus states visible.
- Do not hide key data behind hover.
- Respect reduced motion.
- Avoid tiny text for critical values.
- Hashes and addresses should wrap or truncate intentionally, never break layout unexpectedly.
- Mobile should keep wallet inputs, token IDs, and root hashes usable.

## Redesign Sequencing

When redesigning any surface or the full site, follow this order. It applies to every future redesign session, not just the first one.

1. Establish or confirm global tokens: color, type scale, radius, shadows, borders, motion curves.
2. Redesign the shared header and core primitives (buttons, panels, badges, tables, forms).
3. Redesign Landing as the strongest brand expression.
4. Redesign Atlas as a usable scanner.
5. Redesign Diagnose as a live evidence stream.
6. Redesign Report as a durable proof artifact.
7. Harmonize empty states, loading states, and error states across all surfaces.
8. Verify desktop and mobile.

Steps 1 and 2 must come before any page work. A page redesigned without confirmed tokens will drift from the system.

Each step preserves existing routes and product behavior unless the user explicitly requests structural change. Never remove a page, route, or feature as a side effect of a visual redesign.

## Anti-References

Do not steer LP Doctor toward:

- Generic crypto neon on dark navy.
- Enterprise SaaS dashboard with rounded cards everywhere.
- Beige AI startup editorial minimalism.
- Glassy blur panels with low information density.
- Finance navy and gold.
- Medical clean-room healthcare UI.
- Meme-heavy Y2K that makes the product look unserious.
- Brutalist styling that makes report data harder to read.
- Decorative gradients used as content.

### App-Specific Anti-References

Do not let product-register pages drift toward:

- Identical stat cards in a horizontal row (the hero-metric template applied to app UI).
- Generic dark mode with no visual identity, indistinguishable from any other DeFi tool.
- Tables with no grid structure or low-contrast headers.
- Health states communicated by color alone without text labels.
- Modal dialogs as the first response to user actions that could be inline.
- Progress indicators that hide what phase the agent is in.
- Empty states with generic illustrations or vague copy.
- Over-decorating Diagnose or Report to match Landing energy.

The app is calm, dense, and legible. It is still Neo-Y2K, but through chrome details and type contrast, not through visual noise.

## Testnet And Hackathon Context

LP Doctor is hackathon-native and currently runs on testnet. This context should be visible but not alarming.

Guidelines:

- Testnet status should appear as a persistent chip in the header, not as a warning banner that dominates the page.
- Version labels (e.g., "v0.1 Galileo") may appear in the header or footer as small mono text.
- Hackathon context (0G APAC Hackathon 2026, 0G integration) may appear as sticker badges on the landing page. Do not repeat hackathon branding on every app page.
- 0G Compute TEE attestation should read as a credibility signal, not a marketing line. Keep it compact and link to attestation details.
- If the product moves to mainnet in a future redesign, these indicators should be easy to remove or update. Do not hardcode hackathon copy into structural layout.

## Design North Star

LP Doctor should look like a verifiable DeFi diagnostic console smuggled into a Neo-Y2K hackathon arcade poster.

The landing page earns attention. The app earns trust. The report earns belief.
