# 09 — UK Financial Harm Map (FCA × geo × ONS deprivation)

## Pitch (wow-factor)
An interactive live map of the UK where every FCA-flagged scam firm and every enforcement
fine is geocoded and stacked against ONS regional deprivation — so the audience literally
watches financial harm cluster in the poorest postcodes. Click any region and Claude writes
a plain-English "consumer risk briefing" for that area on the spot.

## Why it wows a live audience
- Motion + colour: a choropleth of Britain that fills in as data loads, red where harm concentrates.
- Instant AI narrative per click = the "vibe coding" payoff (Claude turns rows into a story).
- Politically resonant for the FCA: proves harm is not evenly distributed.

## Data sources (exact URLs + verified status)
| Source | URL | Status |
|---|---|---|
| FCA Warning List (scam firms) | https://www.fca.org.uk/consumers/warning-list-unauthorised-firms | Verified by team |
| FCA fines / enforcement tables | https://www.fca.org.uk/news/news-stories/2024-fines | Verified by team |
| FCA Register API (firm addresses) | https://register.fca.org.uk/services/V0.1/Firm/{FRN} (needs free API key: X-Auth-Email + X-Auth-Key headers) | Verified by team |
| postcodes.io geocode | https://api.postcodes.io/postcodes/{postcode} and bulk POST https://api.postcodes.io/postcodes | **VERIFIED 200** — returns lat/lon, admin_district, parliamentary_constituency, region, lsoa. No key. |
| ONS search/datasets API | https://api.beta.ons.gov.uk/v1/search?q=deprivation | **VERIFIED 200** (318 hits) |
| English Indices of Deprivation 2019 (LSOA IMD) | https://www.gov.uk/government/statistics/english-indices-of-deprivation-2019 (static CSV) | Free CSV fallback |

Reddit and Google Trends were tested and REJECTED: Reddit JSON returns 403 from
datacenter IPs (no UA workaround); Google Trends RSS endpoint is 404/dead. Do not use live.

## 2-hour build plan (Next.js on Vercel + Claude API)
1. **0:00–0:20 Scaffold.** `npx create-next-app` (App Router, TS, Tailwind). Deploy empty to Vercel.
2. **0:20–0:45 Data pipeline (build-time / API route).**
   - Pull Warning List + fines into `data/firms.json` (name, address, postcode, type, amount).
   - Bulk-geocode postcodes: `POST api.postcodes.io/postcodes` (batches of 100) → lat/lon + admin_district.
   - Cache to `public/geo.json` so the demo never hits a cold API on stage.
3. **0:45–1:20 Map UI.** `react-leaflet` (OpenStreetMap tiles, no key) + a UK LAD/region GeoJSON
   (static from ONS geoportal). Colour each region by harm count; markers for individual fines.
   Toggle overlay: deprivation decile from IMD/ONS.
4. **1:20–1:45 AI briefing.** API route `/api/briefing` → Claude (`claude-fable-5`) with the
   region's firm list + deprivation rank in the prompt → returns a 120-word consumer risk note.
   Stream it into a side panel on region click.
5. **1:45–2:00 Polish + deploy.** Legend, loading shimmer, one-line headline stat
   ("X% of flagged firms sit in the 3 most deprived deciles"). Final Vercel deploy.

## Where Claude API adds the wow
- Per-region briefings (main hook). - Auto-generated headline "insight of the day" from the aggregate.
- Fallback: if a click has thin data, Claude summarises the national picture instead.

## Risks / fallbacks
- **postcodes.io rate limit / down** → pre-cached `public/geo.json` (built before demo). Primary safety net.
- **Warning List addresses sparse** → many scam entries lack a UK postcode; supplement with
  Register API addresses for authorised-but-fined firms; show "location unknown" bucket honestly.
- **GeoJSON too heavy** → simplify to region (9 English regions + nations) not LAD; ship < 500 KB.
- **Claude latency on stage** → stream tokens; pre-warm one briefing before going live.
- **IMD is England-only** → label scope as England, or use ONS regional GVA/income as UK-wide proxy.

## Demo script (2 min)
1. "This is every firm the FCA has warned you about, or fined — on one map." (map fills in)
2. Toggle deprivation overlay → "watch the red move onto the poorest areas."
3. Click a hard-hit region → Claude writes the local risk briefing live.
4. Punchline: headline stat on screen. "Harm isn't random — it hunts vulnerability."
