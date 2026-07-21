# 06 — Regulatory Pulse

## Pitch
An AI insight feed that reads every public FCA communication — press releases, speeches, statements, Dear CEO / portfolio letters, consultations — and turns them into plain-English summaries, a rolling theme timeline, and a live "What is the FCA worried about this quarter?" heatmap. In one glance a firm sees which regulatory priorities are heating up (consumer duty, crypto, financial crime, non-bank leverage) without reading 200 PDFs.

## Wow-factor
- **Priority heatmap**: themes on Y-axis, months on X-axis, cell intensity = mention volume. Click a hot cell → the underlying summarised items.
- **"Ask the regulator's mind"**: one-line Claude answer to "what changed this month?" grounded in the last N items.

## Data sources (verified today, 2026-07-21)
| Source | URL | Status |
|---|---|---|
| **Master news RSS** (primary) | `https://www.fca.org.uk/news/rss.xml` | ✅ 200, `application/rss+xml`, 20 items, each `<item>` tagged `<category>`: News stories, Press Releases, Statements, Blogs, **Speeches** |
| News RSS (alias) | `https://www.fca.org.uk/news/rss` | ✅ 200 (identical feed) |
| News HTML listing | `https://www.fca.org.uk/news` | ✅ 200 |
| Publications hub | `https://www.fca.org.uk/publications` | ✅ 200 |
| Publications search + category filter | `https://www.fca.org.uk/publications/search-results?category=<cat>&sort_by=dmetaZ` | ✅ 200, server-rendered HTML |
| Dear CEO letters filter | `...?category=policy%20and%20guidance-dear%20ceo%20letters&sort_by=dmetaZ` | ✅ 200 |
| Portfolio letters | category `policy and guidance-portfolio letters` | ✅ taxonomy confirmed |
| Consultations / policy statements / thematic reviews / regulatory priorities | same search, respective category slugs | ✅ taxonomy confirmed |

**Key finding:** a *single* RSS feed carries every comms type, already categorised → filtering is client-side, no per-type feed needed.

### Gotchas
- Per-type feeds (`/news/press-releases/rss.xml`, `/news/speeches`) → **404**. Only the combined feed exists. Filter by `<category>` instead.
- RSS returns only the latest ~20 items (rolling). For history/heatmap depth, page the publications search (`&start=N`) or cache items over the demo.
- Publications search is HTML, not JSON — parse result rows, or (simplest) just use the RSS feed for the live demo and treat publications as a stretch.
- All fetches need a `User-Agent` header (default UA works; browser UA safest).

## 2-hour build plan (Next.js on Vercel + Claude API)
**T+0:00 — Scaffold (15m)**
- `npx create-next-app@latest regulatory-pulse` (App Router, TS, Tailwind).
- Env: `ANTHROPIC_API_KEY`.

**T+0:15 — Ingest route (25m)**
- `app/api/pulse/route.ts`: fetch RSS, parse `<item>` (title, link, description, pubDate, category) with `fast-xml-parser`.
- Normalise into `{title, url, date, type, text}[]`. Cache in-memory / a JSON file so the heatmap has ≥20 items.

**T+0:40 — Claude enrichment (30m)**
- Model `claude-fable-5` (or `claude-haiku-4-5` for speed/cost on batch).
- One batched call: for each item return `{summary (1 sentence), themes[] from a fixed taxonomy}`. Fixed taxonomy = Consumer Duty, Financial Crime/AML, Crypto, Market Integrity, Prudential/Leverage, Consumer Credit, Enforcement, ESG, Operational Resilience.
- Second call for the "what changed this quarter?" narrative over all summaries.

**T+1:10 — UI (35m)**
- `creating-dashboards` / `frontend-ui-dark-ts` skill for a dark glass dashboard.
- Components: (1) heatmap grid (themes × month, CSS grid, intensity via bg-opacity); (2) feed column of summarised cards with type badge + source link; (3) hero "This quarter" narrative card.

**T+1:45 — Deploy + polish (15m)**
- `vercel deploy`. Seed cache so it loads instantly. Rehearse the click-through.

## Risks / fallbacks
- **RSS shape changes / blocked** → ship with a cached `data/items.json` snapshot committed as fallback; demo works offline.
- **Claude latency on batch** → pre-compute enrichment at build time (static JSON), UI reads the cache; live refresh becomes a "nice to have" button.
- **Thin history (20 items)** → seed the cache earlier in the day by paging publications search; or scope heatmap to "last 6 weeks" so 20 items still looks dense.
- **CORS** → all fetching server-side in the route handler, never client.
- **PDF-only content** (Dear CEO letters) → use the listing title + date for the demo; skip PDF parsing (out of scope for 2h).

## Demo script (5 min)
1. Open dashboard → hero card reads Claude's "What the FCA is focused on this quarter" in plain English.
2. Point at the heatmap: "each cell is how loud a theme is that month." Highlight the hottest cell.
3. Click the hot cell → filtered feed of summarised items, click a source link → real FCA page (proves it's live, not mocked).
4. Hit "Refresh" → new item ingested + summarised live on stage.
5. Close: "Built in two hours over the FCA's own public feed — this is a standing radar for any supervision team."
