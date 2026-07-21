# 09 — UK Financial Harm Map (FCA × geo × ONS deprivation)

> **AUDIT: verified 2026-07-21, by audit-2.** postcodes.io (single + bulk), ONS beta search, FCA Register
> API (`/Firm/{FRN}/Address`, creds in `.env.local`), and CH API all re-tested 200. Map path confirmed
> no-key (react-leaflet + OSM). **Note:** `data/fines.json` (300 firms) has NO postcode/FRN — geocode via
> the CH registered-office path (same as plan 08), which is proven. Wow layer already lands AI briefing +
> interactive map; **chatbot added as the third**.

## Pitch
An interactive live map of the UK where every FCA-flagged scam firm and every enforcement fine is
geocoded and stacked against ONS regional deprivation — so the audience literally watches financial harm
cluster in the poorest postcodes. Click any region and Claude writes a plain-English "consumer risk
briefing"; ask the map anything and Claude answers from the data.

## Wow layer (mandatory — lands all three)
- **(c) Interactive visual:** choropleth of Britain filling in as data loads, red where harm concentrates; markers for individual fines; deprivation toggle.
- **(b) AI briefing:** click a region → Claude writes a 120-word consumer-risk note from its firm list + deprivation rank; streamed into a side panel.
- **(a) Claude chatbot:** "Ask the map" grounded in the aggregated region data → "which region is worst and why?" cited.

## Data sources (re-verified 2026-07-21)
| Source | URL | Status |
|---|---|---|
| FCA fines / firms | `data/fines.json` (300, team-harvested) + `data/warnings-*.{xml,json}` | ✅ local, present |
| Geocode path (primary) | CH `/search/companies` → `/company/{num}` → `registered_office_address.postal_code` → postcodes.io | ✅ 200 (CH key + postcodes.io both live) |
| postcodes.io geocode | `https://api.postcodes.io/postcodes/{postcode}`; bulk `POST https://api.postcodes.io/postcodes` (batch 100) | ✅ 200 — lat/lon, admin_district, region, lsoa. No key |
| FCA Register API (address by FRN) | `https://register.fca.org.uk/services/V0.1/Firm/{FRN}/Address` (headers `X-Auth-Email` + `X-Auth-Key`, in `.env.local`) | ✅ 200 — use only where FRN is known |
| ONS search/datasets API | `https://api.beta.ons.gov.uk/v1/search?q=deprivation` | ✅ 200 |
| English Indices of Deprivation 2019 (LSOA IMD) | `https://www.gov.uk/government/statistics/english-indices-of-deprivation-2019` (static CSV) | Free CSV fallback |

Reddit and Google Trends were tested and REJECTED (Reddit JSON 403 from datacenter IPs; Trends RSS dead). Do not use live.

## 2-hour build plan (Next.js on Vercel + Claude API)
1. **0:00–0:20 Scaffold.** `create-next-app` (App Router, TS, Tailwind). Deploy empty. Env: `COMPANIES_HOUSE_API_KEY`, `ANTHROPIC_API_KEY`.
2. **0:20–0:50 Data pipeline (build-time script).** Fined firms → CH registered-office postcode → bulk
   postcodes.io → lat/lon + admin_district + region. Join IMD decile by LSOA. Cache to `public/geo.json`
   so the demo never hits a cold API on stage.
3. **0:50–1:20 Map UI.** `react-leaflet` (OSM tiles, no key) + a UK region GeoJSON (static, <500KB).
   Colour each region by harm count; markers per fine; toggle overlay = deprivation decile.
4. **1:20–1:45 AI layer.** `/api/briefing` → Claude (`claude-fable-5`) with the region's firm list +
   deprivation rank → 120-word note, streamed to a side panel on region click. Plus `/api/ask` chatbot
   grounded in the region aggregates.
5. **1:45–2:00 Polish + deploy.** Legend, loading shimmer, headline stat ("X% of flagged firms sit in the 3 most deprived deciles"). Final Vercel deploy.

## Risks / fallbacks
- **Claude/chatbot fails live** → pre-warm + cache briefings for the 3 demo regions in `geo.json`; the panel renders from cache, chat degrades to those static briefs.
- **postcodes.io rate limit / down** → pre-cached `public/geo.json` built before demo. Primary safety net.
- **fines.json has no postcode/FRN** → geocode strictly via the CH path above (proven); Register API only for the handful with known FRN.
- **Warning List addresses sparse** → many scam entries lack a UK postcode; show a "location unknown" bucket honestly; lean on fined firms for the map layer.
- **GeoJSON too heavy** → simplify to 9 English regions + nations, not LAD; ship <500KB.
- **IMD is England-only** → label scope as England, or use ONS regional income as a UK-wide proxy.

## Demo script (2 min)
1. "Every firm the FCA has warned you about, or fined — on one map." (map fills in)
2. Toggle deprivation overlay → "watch the red move onto the poorest areas."
3. Click a hard-hit region → Claude writes the local risk briefing live.
4. Type into chat: "which region is worst hit and why?" → cited answer.
5. Punchline: headline stat on screen. "Harm isn't random — it hunts vulnerability."
