# HANDOFF — read this first in a fresh session

_Last updated: 2026-07-21_

## Decision: WE ARE BUILDING PHOENIX WATCH

The chosen demo is **Phoenix Watch — plan `plans/07-phoenix-watch.md`**. That plan is the
single source of truth for the build: pitch, wow layer, data sources, 2-hour timeline.
Read it in full before writing any code.

Key facts (details in the plan):
- Pre-baked graph fixture ready: `data/fixtures/phoenix-graph.json` (159 nodes, 166 edges,
  3 phoenix demo firms + 5 fined seeds). **Build from the fixture**; live Companies House
  chain is the "if time permits" enhancement only.
- `data/fines.json` = 300 fined firms. CH API key in `.env.local` verified working 2026-07-21.
- Starter kit in `starter/` (ChatPanel, chat route, fetch helpers, insight prompt, charts) —
  see `starter/README.md`.
- Wow layer is mandatory: force-directed graph + Claude 3-sentence risk briefing +
  "Ask about this network" chatbot grounded in the graph JSON.

## State of the pitch site (this repo)

- Live site = this Next.js repo, auto-deploys from `main` (github.com/longytravel/FCA).
- Board layout is DONE and committed (`b464d8b`): `app/page.tsx` groups 16 option cards
  into three tiers via `tierOf()` (07–12 "Joined-up public data", 13–16 "Signals nobody
  is watching", 01–06 "Quick wins"). Type-checks clean. Nothing in flight.
- Plans 13–16 + their fixtures are committed. All 16 plans audited, fixtures pre-baked.

## Where the demo build goes

Per plan 07 step 1: the demo itself is a **fresh `create-next-app`** deployed to Vercel —
not this repo. Copy the fixture + needed `starter/` files into it. This repo stays the
pitch site.
