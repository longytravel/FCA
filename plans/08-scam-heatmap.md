# 08 — Scam & Sanctions Heatmap (FCA × Companies House × OFSI × postcodes.io)

> **AUDIT: verified 2026-07-21, by audit-2.** All endpoints re-tested live (200): CH API (key works),
> postcodes.io, OFSI ConList.csv, ONS. No-key map path confirmed (react-leaflet + OpenStreetMap tiles).
> `data/fines.json` = 300 fined firms. **Wow layer upgraded — was zero-AI; now AI briefing + chatbot + map.**
>
> **PRE-BAKED FIXTURE (2026-07-21, data-prep): `data/fixtures/geo-points.json`** — 22 fined firms already
> geocoded (postcodes.io) from `data/seed-firms.json`. Each: `{name, companyNumber, lat, lon, region,
> amount, source}`. Regions: London, South East, East of England, West Midlands, Scotland. This is the map
> pin layer — **load it directly; the live CH→postcodes geocode below is now "if time permits" only.**
> (OFSI sanctions cross-check is a separate live/seeded step — fixture does not include it.)

## Pitch
A single UK map that turns disconnected public datasets into one picture of financial harm: FCA fined
firms geolocated by their Companies House registered office, cross-checked against the OFSI sanctions
list, sized by fine value. Live on stage: a dark UK map lights up with enforcement hotspots; click a
region and Claude writes the local harm briefing; one red halo flags a firm whose officer name matches
a sanctioned individual.

## Wow layer (mandatory — lands all three)
- **(c) Interactive visual:** dark `react-leaflet` UK map, pins sized by fine £, red halo = sanctions/officer flag; sidebar list → fly-to.
- **(b) AI briefing:** click a region/cluster → Claude writes a 100-word "enforcement hotspot" note from the firms + fine totals there.
- **(a) Claude chatbot:** "Ask the map" — grounded in `points.json`. "Where are the biggest fines clustered?" → cited answer.

## Data sources (re-verified 2026-07-21, all HTTP 200)
| Source | URL | Access | Verified |
|--------|-----|--------|----------|
| FCA fined firms 2013–25 | `data/fines.json` (300 rows) | local | ✅ 300 rows |
| Companies House REST API | `.../company/{num}` → `registered_office_address.postal_code`; resolve via `/search/companies?q=` | key in `.env.local` (basic auth) | ✅ 200 live |
| CH advanced-search (fallback, no key) | `https://find-and-update.company-information.service.gov.uk/advanced-search/get-results` | HTML scrape | ✅ 200 |
| postcodes.io geocoder | `https://api.postcodes.io/postcodes/{postcode}` → lat/long + LSOA + region; bulk `POST /postcodes` (batches of 100) | Free, NO key | ✅ 200, returns lat/long+region |
| OFSI consolidated sanctions | `https://ofsistorage.blob.core.windows.net/publishlive/2022format/ConList.csv` | Free, NO key, ~16MB CSV | ✅ 200 |

**Map = no key:** `react-leaflet` + OpenStreetMap raster tiles (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`)
needs no token. Static UK GeoJSON basemap bundled as offline fallback (see risks).

## 2-hour build (Next.js + Vercel)
1. **0:00–0:15** `create-next-app` + deploy. Env: `COMPANIES_HOUSE_API_KEY`, `ANTHROPIC_API_KEY`.
2. **0:15–0:45 (DONE — use fixture).** Copy `data/fixtures/geo-points.json` → `public/points.json` (22
   geocoded fined firms, lat/long + region + fine £ already resolved). *If time permits:* re-run the live
   build script (fined firms → CH `search` + `/company/{num}` → registered-office postcode → postcodes.io
   bulk) to add more pins beyond the 22.
3. **0:45–1:05** Parse OFSI CSV once (server script): extract sanctioned names → fuzzy-match (e.g.
   `string-similarity`) against CH officer names of the fined firms → flag matches. Store hits in `points.json`.
   Expect few/none — a near-match still sells "we screen this automatically." Seed one demo match if truly zero.
4. **1:05–1:30** Map UI: `react-leaflet` (OSM tiles). Pins sized by fine £; red halo = flag; sidebar → fly-to.
5. **1:30–1:55** AI layer: `/api/region-brief` (Claude briefing from a region's firms) + `/api/ask`
   (streaming chatbot grounded in `points.json`). Pre-compute briefs for the 3 hottest regions.
6. **1:55–2:00** Deploy, smoke-test, patter.

## Risks / fallbacks
- **Chatbot/AI fails live** → pre-computed region briefs baked into `points.json`; the brief card renders from cache. Chat degrades to static brief.
- **Warning-List clone firms lack a registered office** → use the ~300 real *fined* firms as the geocoded layer; Warning List = a separate count stat, not pins.
- **OFSI matches are rare** → frame as "automated screening pipeline"; the wow is the join + map, not a guaranteed hit. Pre-scan; seed a demo name if zero.
- **API key / rate limits** → geocoded pins pre-baked to `data/fixtures/geo-points.json`; live demo is 100% static reads, zero CH/postcodes calls on stage.
- **Tile loading on venue wifi** → bundle a static UK region GeoJSON basemap (<500KB) as offline fallback; pins still plot on it.

## Demo script (90 sec)
"Public datasets that never talk to each other — joined on one map." → map fades in, pins bloom by fine
size → "Bigger pins = bigger fines." → click a hotspot region → Claude writes the local briefing live →
click the red halo → "This firm's director matches the OFSI sanctions list — screened automatically." →
type into chat "where's the harm concentrated?" → cited answer. "Two hours, zero paid APIs."
