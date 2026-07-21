# 10 — Rate Shock & Consumer Distress Timeline (FCA × Bank of England)

## Pitch (wow-factor)
Scrub a single timeline from 2020 to today and watch the Bank of England base rate climb
while FCA complaint volumes and scam-warning counts surge behind it — then Claude narrates
the causal story, quarter by quarter, connecting the macro shock to the human harm.

## Why it wows a live audience
- One elegant animated chart tells a national story everyone in the room lived through.
- The AI "so what" layer turns three dry datasets into a narrated documentary of consumer distress.
- Directly on-mission for the FCA: macro conditions → who gets hurt and how.

## Data sources (exact URLs + verified status)
| Source | URL | Status |
|---|---|---|
| BoE Bank Rate daily CSV (series IUDBEDR) | https://www.bankofengland.co.uk/boeapps/database/_iadb-fromshowcolumns.asp?csv.x=yes&Datefrom=01/Jan/2020&Dateto=now&SeriesCodes=IUDBEDR&CSVF=TN&UsingCodes=Y&VPD=Y&VFD=N | **VERIFIED 200** (application/csv, DATE,IUDBEDR) |
| BoE other series (CPI expectations, effective mortgage rate) | same endpoint, swap SeriesCodes (e.g. IUMBV34, IUMBV42) | Same endpoint = verified pattern |
| FCA aggregate complaints (H1/H2 XLSX) | https://www.fca.org.uk/data/complaints-data/aggregate | Verified by team |
| FCA Warning List volumes over time | https://www.fca.org.uk/consumers/warning-list-unauthorised-firms | Verified by team |
| ONS CPI / cost-of-living (optional overlay) | https://api.beta.ons.gov.uk/v1/search?q=consumer+price+index | **VERIFIED 200** |

Reddit sentiment and Google Trends were tested and REJECTED (Reddit 403 from datacenter IPs;
Trends RSS 404). This idea deliberately uses only rock-solid CSV/XLSX endpoints — zero live-demo risk.

## 2-hour build plan (Next.js on Vercel + Claude API)
1. **0:00–0:15 Scaffold + deploy** empty Next.js (App Router, TS, Tailwind) to Vercel.
2. **0:15–0:40 Ingest.** Build script fetches BoE CSV → `data/rate.json`; parse FCA complaints
   XLSX (SheetJS) into per-half-year totals by product category → `data/complaints.json`.
   Cache everything to `public/` so the stage demo is offline-safe.
3. **0:40–1:20 Timeline chart.** `recharts` composed chart: base-rate line (right axis) +
   stacked complaint bars by category (left axis) + warning-count line. A draggable time
   brush / play button animates the reveal 2020→now.
4. **1:20–1:45 AI narration.** `/api/narrate?from=&to=` → Claude (`claude-fable-5`) gets the
   rate move and complaint deltas for the selected window → returns a 2-sentence "what this
   did to consumers" caption. Updates live as the user scrubs.
5. **1:45–2:00 Polish.** Annotate key events (first hike, peak 5.25%), headline KPI
   ("mortgage complaints +N% within 2 quarters of the peak"), final deploy.

## Where Claude API adds the wow
- Scrub-synced narration (main hook) — the chart gains a voice.
- Auto-detected "turning points": Claude flags the quarter where harm accelerated.
- Closing auto-generated executive summary paragraph.

## Risks / fallbacks
- **Correlation ≠ causation** → frame as "timeline / association", let Claude hedge; do not over-claim.
- **Complaints XLSX schema drift** → pin to a known half-year file; pre-parse to JSON before demo.
- **BoE endpoint slow on stage** → pre-cached `public/rate.json` is the safety net.
- **Category mismatch** across complaint periods → map to a fixed 5-category taxonomy in the build step.
- **Claude latency** → stream; pre-compute captions for 3 default windows as fallback.

## Demo script (2 min)
1. "Everyone remembers rates going up. Here's what it did to consumers." (rate line climbs)
2. Hit play → complaint bars swell behind the rate; warning line spikes.
3. Drag the brush over the 2022 hikes → Claude captions the harm in real time.
4. Punchline KPI on screen: "Harm followed the rate — with a two-quarter lag."
