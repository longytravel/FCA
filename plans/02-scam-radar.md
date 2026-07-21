# Scam Radar — Live FCA Warning List Dashboard
`AUDIT: verified 2026-07-21, by audit-1`

## Pitch
A live "Scam Radar" that streams the FCA's newest unauthorised-firm and clone warnings as they publish,
with a one-keystroke "is this firm a scam?" search over 999 harvested warnings, trend charts of scam types
surging, and a Claude-written **daily threat briefing** that reads the feed and tells you what's spiking.
A buried government table turned into a live threat console — with an AI analyst on top.

## Data sources — VERIFIED LIVE TODAY (2026-07-21, no auth)

| Source | URL | Status |
|---|---|---|
| **Warnings RSS (hero, live)** | `https://www.fca.org.uk/news/warnings/rss.xml` | ✅ 200, `application/rss+xml`, 20 newest items, dated today |
| **Full Warning List (corpus)** | `https://www.fca.org.uk/consumers/warning-list-unauthorised-firms?page=N` | ✅ 200, server-rendered HTML table, ~731 pages ≈ 18k records |
| FS Register API (enrich) | `register.fca.org.uk/services/V0.1/...` | ✅ keyed & working (see plan 01) — **optional** stretch enrich |

**Pre-harvested & ready in `data/` (confirmed):**
- `data/warnings-sample.json` — **999 rows**, fields `name, dateAdded, dateUpdated`
  (e.g. `wealthfinez.com (new)`, dated `20/07/2026` — fresh). This is the search + chart corpus. **Ship it.**
- `data/warnings-latest.xml` — 20 RSS items for the live ticker.
- Note: `register.fca.org.uk/s/` is a Salesforce JS app — do NOT scrape. ScamSmart = guidance only, skip.

## Stack
Existing Next.js 15 scaffold (reuse). `fast-xml-parser` for RSS, `recharts` for charts, `@anthropic-ai/sdk`
for the briefing. **Missing deps — install first:** `npm i fast-xml-parser recharts @anthropic-ai/sdk`.
Corpus is static JSON → search + charts never depend on the network.

## 2-hour build plan
- **0:00–0:15 — Setup.** Reuse scaffold; `npm i fast-xml-parser recharts @anthropic-ai/sdk`; add
  `ANTHROPIC_API_KEY`. Copy `data/warnings-sample.json` → `public/data/`. Confirm it loads.
- **0:15–0:35 — Data layer.** `lib/warnings.ts`: load corpus; derive `kind` (`(new)`/`(updated)` from name)
  and `category` by keyword (`capital|markets|fx|crypto|invest|loan` → buckets; TLD `.com/.live/.pro`).
  `lib/rss.ts`: server fetch RSS (`next:{revalidate:300}`), fall back to `warnings-latest.xml` if fetch fails.
- **0:35–1:00 — WOW (c) the console UI.** Hero **live ticker** of RSS 20, auto-refresh 30s, red pulse on new.
  **Search bar**: instant client filter over 999 rows → "⚠ On the FCA Warning List — added DD/MM/YYYY" or
  "✓ Not listed (still verify)". Dark "threat console" theme, monospace domains, red/amber accents.
- **1:00–1:25 — WOW (c) charts (Recharts).** Warnings-per-month area chart from `dateAdded`; category donut
  (clone vs crypto vs loan-fee vs other); stat cards: total 999, added this week, top TLD.
- **1:25–1:50 — WOW (b) AI Threat Briefing.** `/api/briefing`: send category counts + this-week deltas +
  10 newest names to Claude (`claude-fable-5`) → 3-sentence analyst briefing ("Clone-broker domains dominate
  this week's new listings; crypto-investment scams are the fastest-growing category…"). Render in a
  "Today's Read" panel, refresh button. **Pre-generate a static version at build as the live fallback.**
- **1:50–2:00 — Deploy + rehearse.** `vercel --prod`; verify RSS revalidation on prod.

## Risks & fallbacks
- **RSS shifts / rate-limited** → ticker degrades to `warnings-latest.xml` snapshot; search + charts unaffected.
- **Claude API fails live** → briefing falls back to the build-time pre-generated text (still on screen).
- **Never scrape during demo** → 999-row corpus is pre-harvested and committed.
- **CORS** → all fetches server-side (route handlers / RSC).
- **Legal/tone** → footer "Source: FCA. Absence from list ≠ safe — always verify at fca.org.uk." Never imply
  we clear firms.

## Demo script (~90 sec)
1. "The FCA's live scam feed." — ticker ticks a warning in.
2. Type a scam domain from the ticker → instant red "On the Warning List".
3. Type a made-up firm → "Not listed — but verify, scammers rename daily."
4. Trend chart → "Clone-broker scams spiked this month, here's the shape."
5. **"Today's Read" panel — Claude's threat briefing** summarising the surge in plain English.
6. "Built in 2 hours on live government data — this could ship to consumers tomorrow."
