# Enforcement Insights — FCA Fines Dashboard

## Pitch
An interactive dashboard of every FCA fine from 2013–2025 that turns a scattered set of static tables into a living picture of enforcement: total penalties by year, biggest fines, sector and breach-type breakdowns, and a searchable, filterable ledger of every notice. In two hours we go from public data on fca.org.uk to a shareable web app the FCA's own teams can explore live.

## Data sources (VERIFIED fetchable — plain server-rendered HTML, no JS)
Scheme: `https://www.fca.org.uk/news/news-stories/{YEAR}-fines`

| Year | URL | Status |
|------|-----|--------|
| 2025 | .../2025-fines | ✅ 200, table (total £124.2m) |
| 2024 | .../2024-fines | ✅ 200, table (total £176.0m) |
| 2023 | .../2023-fines | ✅ 200, table (total £53.4m) |
| 2013 | .../2013-fines | ✅ 200, table (total £474.3m) |
| 2011, 2012, 2010, 2005 | — | ❌ 404 (scheme starts 2013) |

**Confirmed range: 2013–2025 = 13 years**, all same URL pattern, all fetched successfully via HTTP GET.
Pre-2013 fines live on legacy FSA archive pages under a different scheme — **out of scope** for the demo (mention as a stretch/fallback).

### Table structure (consistent across years)
Columns: **Firm or individual fined** | **Date** | **Amount** | **Reason** (2013 header reads "Reasoning").
- Amount: `£1,377,968` style strings → strip `£`/commas → int. Watch for **"Court fine:"** prefixes (2025) — flag/exclude from FCA-imposed totals.
- Firm cell: anchor linking to a **Final Notice PDF** (`/publication/final-notices/{slug}-{year}.pdf`) for recent years, or a press release / `/your-fca/documents/...` for older years. Capture href as `sourceUrl`.
- Reason: free text but richly structured — contains **sector** ("retail bank sector", "pensions", "investment bank", "issuer") and **breach type** (PRIN 3, APER, COCON, Market Abuse Regulation, LIBOR, listing rules, SYSC, financial crime). Parse via keyword tagging.
- Each page states an authoritative **year total** — use to validate our sum.

## Scrape approach (pre-build, before demo)
1. Node script fetches all 13 URLs (`2013`–`2025`).
2. Parse with **cheerio**: select the fines `<table>`, iterate rows, extract 4 cells + first anchor href.
3. Normalise: `{ year, firm, date (ISO), amount (int), reason, sourceUrl, isCourtFine }`.
4. Tag `sector` and `breachType` by keyword-matching the reason text (dictionary of ~15 patterns → categories; default "Other").
5. Reconcile our per-year sum against the page-stated total; log deltas.
6. Write `public/data/fines.json` (single file, ~13yrs × ~30 rows ≈ 400 records, small). **Commit the JSON** — app reads static, never scrapes at runtime.

## 2-hour build plan (Next.js + Vercel, pre-scraped JSON)
- **0:00–0:25** Scrape script → `fines.json`. Eyeball totals vs page totals.
- **0:25–0:40** `create-next-app` (App Router, TS, Tailwind), Recharts. Load JSON in a client component / `page.tsx`.
- **0:40–1:05** Hero KPIs: total fined all-time, biggest single fine, count of notices, worst year. Bar chart: total £ by year.
- **1:05–1:30** Breakdown charts: fines by sector (bar), by breach type (donut). Both driven off the tags.
- **1:30–1:55** Searchable/filterable table: text search on firm+reason, filters for year/sector, sort by amount, row links to Final Notice PDF. "Top 10 biggest fines" leaderboard.
- **1:55–2:00** Deploy to Vercel, smoke-test live URL.

## Stack
Next.js 15 (App Router) · TypeScript · Tailwind · Recharts · cheerio (build-time only) · Vercel. All data static JSON — zero runtime dependency on fca.org.uk, so the live site can't break mid-demo.

## Risks & fallbacks
- **Reason-text tagging is fuzzy** → keep an "Other" bucket; don't over-promise precision. Sector/breach charts are "indicative".
- **Court fines / non-FCA penalties** (2025) skew totals → flag `isCourtFine`, exclude from headline total, note asterisk.
- **Multi-firm rows** (e.g. 2013 Lloyds TSB + Bank of Scotland share one row) → acceptable to treat as one record for demo.
- **Site changes / offline during demo** → mitigated: data is pre-scraped and committed; nothing fetched live.
- **Time overrun** → cut donut chart and sector filter first; KPIs + year bar chart + searchable table is a complete, impressive MVP on their own.
- **Pre-2013 data requested** → state it's on the legacy FSA archive (different scheme) and a fast-follow, not blocking.

## Demo script (the "vibe")
1. "This is 13 years of every FCA fine — data that's on your own site but locked in 13 separate tables." Open the live dashboard.
2. Hit the headline: total £ imposed since 2013, biggest ever fine — click through to its Final Notice PDF.
3. "Which years were the toughest?" — point at the year bar chart (2013 LIBOR era spikes).
4. "Which sectors, which breaches?" — sector + breach donut.
5. Live search: type "financial crime" or "Barclays" — table filters instantly, each row deep-links to the notice.
6. Close: "Built in two hours, entirely from public data — this is the kind of self-service insight layer we can put over any FCA dataset."
