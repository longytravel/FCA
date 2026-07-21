# Scam Radar — Live FCA Warning List Dashboard

## Pitch
A live "Scam Radar" that streams the FCA's newest unauthorised-firm and clone-scam
warnings as they're published, with a search box that answers "is this firm a scam?"
in one keystroke — plus trend charts showing scam types (crypto, clone, loan-fee)
surging in real time. It turns a buried government table into a dashboard that feels
like a live threat feed.

## Data sources (all VERIFIED working today, no auth)

| Source | URL | Access | Status |
|---|---|---|---|
| **Warnings RSS (hero, live)** | `https://www.fca.org.uk/news/warnings/rss.xml` | GET, returns `application/rss+xml`, 20 newest warnings | ✅ 200, fresh (items dated today, multiple per day) |
| **Full Warning List (search corpus)** | `https://www.fca.org.uk/consumers/warning-list-unauthorised-firms?page=N` | GET server-rendered HTML `<table>`, 25 rows/page, columns Name / Date added / Date updated | ✅ 200, ~731 pages ≈ **18,000+ records**, scrapeable |
| FS Register API (optional enrich) | `https://register.fca.org.uk/services/V0.1/...` | JSON, but requires free API key + `X-Auth-Email`/`X-Auth-Key` headers | ⚠️ 403 without key — signup not instant, **skip for demo** |

Notes verified live:
- RSS titles look like `wealthfinez.com (new)`, `stonehavenmarkets.com (new)` — mostly
  scam domain names, `(new)` / `(updated)` suffix = perfect for a ticker + type tagging.
- Warning List register (`register.fca.org.uk/s/`) is a Salesforce JS app — do NOT scrape it.
  Use the fca.org.uk consumer page instead (server-rendered, no JS needed).
- ScamSmart (`fca.org.uk/scamsmart`) is guidance content only — no structured data feed. Skip.

## 2-hour build plan (Next.js App Router + Vercel)

**0:00–0:20 — Scaffold + data layer**
- `npx create-next-app scam-radar` (TS, Tailwind, App Router).
- `lib/rss.ts`: server fetch RSS, parse with `fast-xml-parser`, map to
  `{name, link, date, kind: new|updated}`. Cache 5 min (`next: {revalidate:300}`).

**0:20–0:50 — Build the search corpus**
- `scripts/scrape.ts`: loop pages 0–150 of the Warning List (~3,750 firms is plenty
  for a demo), extract `<tbody>` rows (name from `<th>`, two `<td>` dates), write
  `public/warnings.json`. Run once at build; ship static. (Full 731 pages if time.)
- Tag `kind` from the name/domain: `.com/.live/.pro` → likely clone/broker scam;
  keywords `capital|markets|fx|crypto|invest|loan` → category buckets.

**0:50–1:20 — UI (the wow)**
- Hero: **live ticker** of RSS newest 20, auto-refresh every 30s, red pulse on new.
- **Search bar**: instant client-side filter over `warnings.json` — type a firm/domain,
  get "⚠️ On the FCA Warning List — added DD/MM/YYYY" or "✓ Not on the list (still verify)".
- **Trend chart** (Recharts): warnings-per-month bar/area from the corpus dates, +
  a category donut (clone vs crypto vs loan-fee vs other).
- Big stat cards: total warnings, added this week (from RSS dates), top TLD.

**1:20–1:45 — Polish + deploy**
- Dark "threat console" theme, monospace domains, red/amber accents.
- `vercel deploy`. Verify RSS revalidation works on prod.

**1:45–2:00 — Buffer / demo rehearsal.**

## Risks & fallbacks
- **RSS format shifts / rate limit** → corpus JSON alone still powers search + charts;
  ticker degrades gracefully to "latest from snapshot".
- **Scrape too slow live** → pre-run `scrape.ts` before the session; commit `warnings.json`.
  Never scrape during the demo.
- **CORS** → all fetches are server-side (Next route handlers / RSC), so no browser CORS.
- **Legal/tone** → data is public FCA consumer data; add footer "Source: FCA. Always
  verify at fca.org.uk — absence from list ≠ safe." Avoid implying we clear firms.
- **Register API** → explicitly out of scope; mention as "v2 enrichment" if asked.

## Demo script (90 sec)
1. "This is the FCA's live scam feed." — point at ticker, a warning ticks in.
2. Type a scam domain from the ticker into search → instant red "On the Warning List".
3. Type a made-up firm → "Not listed — but verify, scammers rename daily."
4. Scroll to trend chart → "Clone-broker scams spiked this month, here's the shape."
5. "Built in 2 hours on live government data — this could ship to consumers tomorrow."
