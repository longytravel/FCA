# 08 — Scam & Sanctions Heatmap (FCA × Companies House × OFSI × ONS)

## Pitch
A single UK map that turns four disconnected public datasets into one picture of financial harm:
FCA fined/blacklisted firms geolocated by their registered office, cross-checked against the OFSI
sanctions list, layered over ONS regional deprivation. Live on stage: a dark UK map lights up with
enforcement hotspots and one red pin where a firm's officer name matches a sanctioned individual.

## Data sources
| Source | URL | Access | Verified |
|--------|-----|--------|----------|
| FCA fined firms 2013–25 | team-scraped tables | HTML | YES (team) |
| Companies House REST API | https://api.company-information.service.gov.uk/company/{num} → `registered_office_address.postal_code` | Free instant API key (basic auth) | YES (401 without key) |
| CH advanced-search (fallback, no key) | https://find-and-update.company-information.service.gov.uk/advanced-search/get-results | HTML scrape | YES (HTTP 200) |
| postcodes.io geocoder | https://api.postcodes.io/postcodes/{postcode} → lat/long + LSOA + region | **Free, NO key** | YES (HTTP 200, returns lat/long+LSOA) |
| OFSI consolidated sanctions | https://ofsistorage.blob.core.windows.net/publishlive/2022format/ConList.csv | Free, NO key, 16.6MB CSV | YES (HTTP 200, updated 03/06/2026) |
| ONS Nomis (deprivation/regional) | https://www.nomisweb.co.uk/api/v01/... | Free, NO key | YES (HTTP 200) |

## 2-hour build (Next.js + Vercel)
1. **0:00–0:15** `create-next-app` + Vercel deploy. Add `CH_API_KEY` env.
2. **0:15–0:45** Build data (offline script, output to `/public/points.json`): for ~40 FCA fined
   firms → CH `search`+`/company/{num}` → registered-office postcode → postcodes.io → lat/long +
   region. Pre-cache; live app reads JSON only.
3. **0:45–1:15** Parse OFSI CSV once (server script): extract sanctioned names → fuzzy-match against
   CH officer names of the fined firms → flag matches (expect few/none; even a near-match is a strong
   "we can screen this automatically" line). Store hits in `points.json`.
4. **1:15–1:45** Map UI: `react-leaflet` (OpenStreetMap tiles, no key) or MapLibre. Plot pins sized
   by fine £, colored by ONS region deprivation decile; red halo = sanctions/officer flag. Sidebar
   list clickable → fly to pin.
5. **1:45–2:00** Deploy, smoke-test, patter.

## Risks / fallbacks
- **Warning-List clone firms lack a registered office** — use the well-defined *fined* firms
  (~400, real companies) as the geocoded layer; treat Warning List as a separate count stat, not pins.
- **OFSI name matches are rare** — frame honestly as "automated screening pipeline"; the WOW is the
  join + map, not guaranteeing a hit. Pre-scan and, if truly zero, demo the mechanism on a seeded name.
- **API key / rate limits** — pre-cache everything to `points.json`; live demo is 100% static reads.
- **Tile loading on venue wifi** — bundle a static UK GeoJSON basemap as offline fallback.

## Demo script (90 sec)
"Four government datasets that never talk to each other." → map fades in, pins bloom by fine size →
"Darker regions = higher deprivation, from ONS. Bigger pins = bigger fines." → click red halo →
"This firm's director name matches the OFSI sanctions list — screened automatically. Two hours,
zero paid APIs." 
