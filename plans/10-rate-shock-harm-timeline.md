# 10 — Rate Shock & Consumer Distress Timeline (FCA × Bank of England)

> **AUDIT: verified 2026-07-21, by audit-2.** BoE Bank Rate CSV re-tested: 200, `application/csv`,
> header `DATE,IUDBEDR`, 1654 daily rows 2020→now. ONS beta search 200. Complaints pre-harvested in
> `data/complaints/` (`aggregate-complaints-2025-h2.xlsx`, firm-level, FOS quarterly). Wow layer already
> lands AI narration + interactive timeline; **chatbot added as the third**. Lowest live-demo risk of the set.

## Pitch
Scrub a single timeline from 2020 to today and watch the Bank of England base rate climb while FCA
complaint volumes and scam-warning counts surge behind it — then Claude narrates the causal story,
quarter by quarter, connecting the macro shock to the human harm. Ask it anything about the window on screen.

## Wow layer (mandatory — lands all three)
- **(c) Interactive visual:** `recharts` composed chart — base-rate line + stacked complaint bars + warning line, with a draggable brush / play button that animates the reveal 2020→now.
- **(b) AI narration:** scrub-synced Claude caption ("what this did to consumers") that updates as the window changes; auto-detected turning points.
- **(a) Claude chatbot:** "Ask the timeline" grounded in the series JSON for the selected window → "why did complaints spike in 2023?" cited to the numbers.

## Data sources (re-verified 2026-07-21)
| Source | URL | Status |
|---|---|---|
| BoE Bank Rate daily CSV (IUDBEDR) | `https://www.bankofengland.co.uk/boeapps/database/_iadb-fromshowcolumns.asp?csv.x=yes&Datefrom=01/Jan/2020&Dateto=now&SeriesCodes=IUDBEDR&CSVF=TN&UsingCodes=Y&VPD=Y&VFD=N` | ✅ 200, `application/csv`, `DATE,IUDBEDR`, 1654 rows |
| BoE other series (mortgage rate etc.) | same endpoint, swap `SeriesCodes` (e.g. IUMBV34, IUMBV42) | ✅ verified pattern |
| FCA aggregate complaints (H2 2025 XLSX) | `data/complaints/aggregate-complaints-2025-h2.xlsx` (pre-harvested) | ✅ present locally |
| FCA firm-level + FOS quarterly complaints | `data/complaints/firm-level-complaints-2025-h2.xlsx`, `fos-quarterly-complaints-Q4-2025-26.xlsx` | ✅ present locally |
| FCA Warning List volumes over time | `data/warnings-latest.xml` + `data/warnings-sample.json` | ✅ present locally |
| ONS CPI / cost-of-living (optional overlay) | `https://api.beta.ons.gov.uk/v1/search?q=consumer+price+index` | ✅ 200 |

Reddit sentiment and Google Trends were tested and REJECTED (Reddit 403 from datacenter IPs; Trends RSS dead).
This idea deliberately uses only rock-solid CSV/XLSX endpoints — zero live-demo risk.

## 2-hour build plan (Next.js on Vercel + Claude API)
1. **0:00–0:15 Scaffold + deploy** empty Next.js (App Router, TS, Tailwind). Env: `ANTHROPIC_API_KEY`.
2. **0:15–0:40 Ingest.** Build script fetches BoE CSV → `public/rate.json`; parse the pre-harvested
   complaints XLSX (SheetJS) into per-half-year totals by product category → `public/complaints.json`.
   Cache everything to `public/` so the stage demo is offline-safe.
3. **0:40–1:15 Timeline chart.** `recharts` composed chart: base-rate line (right axis) + stacked complaint
   bars by category (left axis) + warning-count line. Draggable time brush / play button animates 2020→now.
4. **1:15–1:45 AI layer.** `/api/narrate?from=&to=` → Claude (`claude-fable-5`) gets the rate move +
   complaint deltas for the window → 2-sentence caption, updates as the user scrubs. Plus `/api/ask`
   chatbot grounded in the same window series.
5. **1:45–2:00 Polish.** Annotate key events (first hike, peak 5.25%), headline KPI ("mortgage complaints +N% within 2 quarters of the peak"), final deploy.

## Risks / fallbacks
- **Claude/chatbot fails live** → pre-compute captions for 3 default windows (2020 base, 2022 hikes, peak→now) and bake them in; scrub caption + chat both degrade to these. Chart still animates and tells the story alone.
- **Correlation ≠ causation** → frame as "timeline / association"; let Claude hedge; do not over-claim.
- **Complaints XLSX schema drift** → pinned to the pre-harvested H2-2025 file; pre-parse to JSON before demo.
- **BoE endpoint slow on stage** → pre-cached `public/rate.json` is the safety net.
- **Category mismatch across periods** → map to a fixed 5-category taxonomy in the build step.

## Demo script (2 min)
1. "Everyone remembers rates going up. Here's what it did to consumers." (rate line climbs)
2. Hit play → complaint bars swell behind the rate; warning line spikes.
3. Drag the brush over the 2022 hikes → Claude captions the harm in real time.
4. Ask the chat: "why did complaints jump here?" → cited answer.
5. Punchline KPI on screen: "Harm followed the rate — with a two-quarter lag."
