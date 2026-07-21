# 15 — App Store Distress Radar (Google Play reviews as an early-warning feed)

> **VERIFIED 2026-07-21, by idea-external-1.** `google-play-scraper` (npm) fetches live UK Play Store
> reviews with **no API key** — tested against 6 UK finance apps, returns `{score, date, text, thumbsUp,
> version, replyDate}`. Trustpilot was tested and **REJECTED** (403 from datacenter IPs, no `__NEXT_DATA__`).
>
> **PRE-BAKED FIXTURE: `data/fixtures/gplay-reviews.json`** — 360 real newest reviews across 6 firms:
> Monzo (60), Revolut (60), Starling (60), Klarna/BNPL (60), NatWest (60), Lloyds (60). Segments:
> neobank / bnpl / highstreet. Each row: `{firm, segment, appId, score(1-5), date, text, thumbsUp,
> version, replyDate}`. Load this directly; the live scrape below is "if time permits" only.

## Pitch
**The consumer signal the FCA doesn't have.** When an app freezes withdrawals, botches a fee change, or
suffers an outage, customers rage in the app store *hours later* — long before a formal complaint reaches
the FOS (months) or the FCA (never, individually). This dashboard reads live Google Play reviews for
regulated firms, and Claude reads *between the stars*: it classifies each 1-2★ review into FCA harm
categories (access-to-cash, unexpected fees, fraud/scam, service collapse, vulnerable-customer harm),
detects **sentiment spikes per firm**, and surfaces a ranked "who's wobbling this week" watchlist. It's a
supervisory nowcast built entirely on public consumer voice the regulator has never ingested.

## Wow layer (mandatory — lands all three)
- **(c) Interactive visual:** `recharts` — per-firm sentiment sparkline (rolling avg score by day) with a
  red spike-marker when negative-review share jumps; click a firm → its review stream, colour-coded by
  Claude harm-category chips.
- **(b) AI insight:** Claude reads each negative review → harm category + one-line "what the customer is
  actually reporting", and writes a per-firm **supervisory brief** ("Firm X: 22% of this week's reviews cite
  failed payments after v7.32 — access-to-cash risk").
- **(a) Claude chatbot:** "Ask the review wall" grounded in the loaded reviews → "which firm has the worst
  fraud signal right now?" cited to specific reviews.

## Data sources (verified 2026-07-21)
| Source | How | Status |
|---|---|---|
| Google Play reviews | `google-play-scraper` npm → `gplay.reviews({appId, country:'gb', lang:'en', sort:NEWEST})` | ✅ live, no key, 6 apps tested |
| App IDs (verified working) | Monzo `co.uk.getmondo`, Revolut `com.revolut.revolut`, Starling `com.starlingbank.android`, Klarna `com.myklarnamobile`, NatWest `com.rbs.mobile.android.natwest`, Lloyds `com.grppl.android.shell.CMBlloydsTSB73` | ✅ all return 60 reviews |
| FCA garnish (join firm → regulated status) | `data/seed-firms.json`, `data/warnings-sample.json` | ✅ present locally |
| Historical scores (optional overlay) | `gplay.app({appId})` → `histogram` of all-time ratings | ✅ pattern verified |

**Rejected:** Trustpilot (403, JS-gated). Reddit + Google Trends already rejected upstream. **App Store
(Apple)** not tested — Google Play alone is sufficient and stable.

## 2-hour build plan (Next.js on Vercel + Claude API)
1. **0:00–0:15 Scaffold + deploy** empty Next.js (App Router, TS, Tailwind). Env: `ANTHROPIC_API_KEY`.
2. **0:15–0:35 Ingest (DONE — use fixture).** Copy `data/fixtures/gplay-reviews.json` → `public/reviews.json`.
   *If time permits:* add `/api/refresh` that runs `google-play-scraper` server-side to append today's newest
   reviews (wrap in try/catch → fall back to fixture). Everything cached to `public/` = offline-safe on stage.
3. **0:35–1:05 Firm dashboard.** Per-firm cards: rolling-average score sparkline, negative-share %, review
   count, **spike badge** (negative share > firm baseline). Rank firms by a simple distress score
   (negative-share × volume × recency). Click-through to the review stream.
4. **1:05–1:45 AI layer.** `/api/classify` batches negative reviews to Claude (`claude-fable-5`) →
   `{category, summary}` per review (cache results to `public/classified.json` to avoid re-billing on stage).
   `/api/brief?firm=` → one-paragraph supervisory brief. `/api/ask` chatbot grounded in loaded reviews.
5. **1:45–2:00 Polish.** Headline KPI ("Firm with the sharpest negative spike this week"), harm-category
   legend, FCA-status chip on each firm (regulated? on warning list?), final deploy.

## Risks / fallbacks
- **Claude classify fails live** → pre-bake `public/classified.json` (run the classifier once before stage on
  the 360 fixture reviews); dashboard + chatbot degrade to the cached labels. Chart + spike detection are
  pure JS and need no LLM.
- **Live scrape rate-limited / blocked on stage** → fixture is the primary source; live refresh is optional
  garnish only. Never demo-critical.
- **Small sample per firm (60)** → frame as "sample / signal", not census; the point is *relative* spikes,
  not absolute complaint counts. Say so on screen.
- **Reviews are noisy / off-topic ("it is so good and yeah")** → Claude filters to *actionable* harm reports;
  low-signal 5★ reviews are excluded from the brief. This filtering *is* the demo moment.
- **Firm identity / defamation risk** → present as consumer-sentiment signal requiring supervisory
  verification, never as a finding of wrongdoing. Hedge in every generated brief.
- **App ID drift** (Klarna returned a BNPL app; Zopa/Monese IDs failed) → the 6 pinned IDs above are
  verified; don't add new ones live without testing.

## Demo script (2 min)
1. "The FCA sees complaints months late. Consumers post the moment something breaks. Watch." (dashboard loads)
2. Point at the firm watchlist — one firm glows red with a negative spike.
3. Click it → the review stream, Claude's harm-category chips lighting up ("failed payment", "locked out").
4. Read Claude's supervisory brief aloud: "22% of this week's reviews cite X after v7.32."
5. Ask the chat: "which firm has the worst fraud signal?" → cited answer.
6. Punchline: "This is harm the regulator could hear *today* — for free, before a single complaint is filed."
