# 06 — Regulatory Pulse

> **AUDIT: verified 2026-07-21, by audit-2.** All endpoints re-tested live (200). RSS + publications
> search confirmed. Wow layer upgraded to hit all three: Claude chatbot + AI briefings + interactive heatmap.

## Pitch
An AI insight feed that reads every public FCA communication — press releases, speeches, statements,
Dear CEO / portfolio letters, consultations — and turns them into plain-English summaries, a rolling
theme timeline, and a live "What is the FCA worried about this quarter?" heatmap. In one glance a
supervisor sees which priorities are heating up (Consumer Duty, crypto, financial crime, non-bank
leverage) without reading 200 PDFs — then interrogates the feed by chat.

## Wow layer (mandatory — lands all three)
- **(a) Claude chatbot — "Ask the regulator's mind":** a chat box grounded in the last N ingested
  items (summaries + titles + dates passed in the system prompt = RAG-lite, no vector DB needed).
  Ask "what's the FCA saying about crypto lately?" → cited answer with source links. **This is the headline.**
- **(b) AI briefing text:** one-sentence Claude summary per item + a hero "What changed this quarter"
  narrative over all summaries.
- **(c) Interactive visual:** priority heatmap (themes Y-axis × months X-axis, cell intensity = mention
  volume). Click a hot cell → the underlying summarised items filter in.

## Data sources (re-verified 2026-07-21, all HTTP 200)
| Source | URL | Status |
|---|---|---|
| **Master news RSS** (primary) | `https://www.fca.org.uk/news/rss.xml` | ✅ 200, `application/rss+xml`, ~20 items, each `<item>` has `<category>`: News, Press Releases, Statements, Blogs, Speeches |
| News RSS (alias) | `https://www.fca.org.uk/news/rss` | ✅ 200 (identical feed) |
| Publications search + category filter | `https://www.fca.org.uk/publications/search-results?category=<cat>&sort_by=dmetaZ` | ✅ 200, server-rendered HTML |
| Dear CEO / portfolio letters, consultations, policy statements | same search, respective category slugs | ✅ taxonomy confirmed |

**Key finding:** a *single* RSS feed carries every comms type, already categorised → filtering is
client-side, no per-type feed needed.

### Gotchas
- Per-type feeds (`/news/press-releases/rss.xml`) → **404**. Only the combined feed exists. Filter by `<category>`.
- RSS returns only the latest ~20 items. For heatmap depth, page publications search (`&start=N`) or cache items during the day.
- Publications search is HTML, not JSON — parse rows, or just use RSS for the live demo (publications = stretch).
- All fetches server-side (CORS) with a browser `User-Agent`.

## 2-hour build plan (Next.js on Vercel + Claude API)
**T+0:00 — Scaffold (15m)** — `create-next-app` (App Router, TS, Tailwind). Env: `ANTHROPIC_API_KEY`.

**T+0:15 — Ingest route (20m)** — `app/api/pulse/route.ts`: fetch RSS, parse `<item>` (title, link,
description, pubDate, category) with `fast-xml-parser`. Normalise → `{title,url,date,type,text}[]`.
Cache to a JSON file so the heatmap has ≥20 items.

**T+0:35 — Claude enrichment (25m)** — model `claude-fable-5` (or `claude-haiku-4-5` for batch speed).
One batched call: per item return `{summary (1 sentence), themes[] from fixed taxonomy}`. Taxonomy =
Consumer Duty, Financial Crime/AML, Crypto, Market Integrity, Prudential/Leverage, Consumer Credit,
Enforcement, ESG, Operational Resilience. Second call → the "what changed this quarter" narrative.

**T+1:00 — Chatbot route (25m)** — `app/api/ask/route.ts`: streaming Claude call, system prompt =
"You are the FCA regulatory-pulse analyst. Answer ONLY from these items:" + all summaries/titles/dates/urls.
Return answer + the item links it used. Simple chat UI (input + streamed bubble + source chips).

**T+1:25 — Dashboard UI (25m)** — `creating-dashboards` / `frontend-ui-dark-ts` skill. Components:
(1) heatmap grid (CSS grid, intensity via bg-opacity, clickable cells); (2) feed column of summarised
cards with type badge + source link; (3) hero "This quarter" narrative; (4) chat panel.

**T+1:50 — Deploy + rehearse (10m)** — `vercel deploy`. Seed cache so it loads instantly. Rehearse click-through + one chat question.

## Risks / fallbacks
- **Chatbot/API fails live** → ship 3 pre-computed Q&A answers keyed to buttons ("Crypto?", "Consumer Duty?",
  "This quarter?"); the "chat" degrades to instant canned insight cards. Demo never dead-airs.
- **RSS shape changes / blocked** → committed `data/items.json` snapshot as fallback; demo works offline.
- **Claude latency on batch** → pre-compute enrichment at build time (static JSON); live refresh becomes a "nice to have" button.
- **Thin history (20 items)** → seed cache earlier by paging publications; or scope heatmap to "last 6 weeks" so 20 items looks dense.
- **PDF-only content** (Dear CEO letters) → use listing title + date; skip PDF parsing (out of scope for 2h).

## Demo script (5 min)
1. Hero card reads Claude's "What the FCA is focused on this quarter" in plain English.
2. Point at heatmap: "each cell is how loud a theme is that month." Highlight the hottest cell.
3. Click the hot cell → filtered summarised items → click a source link → real FCA page (proves it's live).
4. **Type into the chat: "What's the FCA worried about in crypto right now?" → streamed, cited answer.**
5. Hit "Refresh" → new item ingested + summarised live. Close: "A standing radar for any supervision team, built in two hours over the FCA's own public feed."
