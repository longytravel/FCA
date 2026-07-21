# 16 — Constituency Grievance Map (Parliament petitions as a geographic harm signal)

> **VERIFIED 2026-07-21, by idea-external-1.** `petition.parliament.uk` JSON API works with **no key**:
> `/petitions.json?q=&state=` for search, `/petitions/{id}.json` for detail. Detail carries
> **`signatures_by_constituency`** (all 650 seats, each with `name`, `ons_code`, `mp`, `signature_count`)
> and `signatures_by_region` — a ready-made map to ONS geography and postcodes.
>
> **PRE-BAKED FIXTURE: `data/fixtures/petitions-finance.json`** — 20 finance/consumer-harm petitions,
> **11,971 constituency rows total**, full geography per petition. Each: `{id, action, matched_term, state,
> background, signature_count, created_at/opened_at/closed_at, government_response, departments, topics,
> signatures_by_constituency:[{name, ons_code, mp, signature_count}], signatures_by_region}`. Hero example:
> WASPI pension compensation (161,788 sigs). Load this directly; live fetch is "if time permits" only.

## Pitch
**The consumer signal the FCA doesn't have.** When financial harm goes national — a mis-selling scandal,
a pension injustice, extortionate loan charges, APP-fraud losses — people don't file an FCA complaint,
they *sign a petition*. Parliament publishes every signature broken down by **constituency with ONS codes**.
This turns a raw grievance feed into a **map of where financial anger is concentrated** — and Claude is the
relevance engine that separates the financial-harm petitions from the political noise, tags each by harm
theme, and reads the geography ("this loan-charge anger clusters in the North East and South Wales"). It's a
consumer-harm heatmap the FCA could join straight onto its own firm/postcode data — built on democratic
signal it has never touched.

## Wow layer (mandatory — lands all three)
- **(c) Interactive visual:** UK constituency **choropleth** (leaflet + a lightweight GeoJSON, or a
  hex-cartogram) keyed on `ons_code` → signature intensity per seat; a petition picker recolours the map;
  hover a seat → MP + signature count.
- **(b) AI insight:** Claude classifies each petition as financial-harm (yes/no) + harm theme + affected
  consumer group, and writes a **geographic read** per petition ("signatures over-index in coastal/older
  constituencies — consistent with pension-related harm").
- **(a) Claude chatbot:** "Ask the map" grounded in the petition + constituency data → "where is car-finance
  anger strongest?" → cited seats and counts.

## Data sources (verified 2026-07-21)
| Source | URL | Status |
|---|---|---|
| Petition search | `https://petition.parliament.uk/petitions.json?q={term}&state={open\|closed}` | ✅ 200, 25/page, no key |
| Petition detail (geography) | `https://petition.parliament.uk/petitions/{id}.json` | ✅ 200, 650-seat breakdown + ONS codes |
| Constituency GeoJSON (for the map) | ONS Open Geography Portal boundaries (Westminster PCON), keyed on `ons_code` | ⚠️ fetch/bundle a simplified file at build; hex-cartogram is the offline fallback |
| FCA garnish (join) | `data/seed-firms.json`, `data/warnings-sample.json` — overlay firm HQ / warned-firm postcodes | ✅ present locally |

**Rejected upstream:** Reddit, Google Trends. **Honest note:** petition full-text search is *noisy* — a
keyword like "fraud" surfaces many non-financial petitions. That noise is deliberately left in the fixture
because **Claude filtering it to genuine financial-harm petitions is the headline demo moment** (LLM as the
relevance classifier). Pure finance-specific petition volume is thin, so frame this as thematic + geographic,
not high-frequency.

## 2-hour build plan (Next.js on Vercel + Claude API)
1. **0:00–0:15 Scaffold + deploy** empty Next.js (App Router, TS, Tailwind). Env: `ANTHROPIC_API_KEY`.
2. **0:15–0:35 Ingest (DONE — use fixture).** Copy `data/fixtures/petitions-finance.json` →
   `public/petitions.json`. *If time permits:* `/api/refresh` re-queries the live petitions API for fresh
   signature counts (try/catch → fixture). Bundle a simplified constituency GeoJSON into `public/` at build.
3. **0:35–1:05 Map.** Leaflet choropleth joined on `ons_code`; petition picker recolours; legend by
   signature intensity. **Fallback:** a CSS hex-grid cartogram of 650 seats needs no GeoJSON download and is
   fully offline — build this first if map tiles are risky on stage.
4. **1:05–1:45 AI layer.** `/api/classify` → Claude (`claude-fable-5`) tags each petition
   `{isFinancialHarm, theme, affectedGroup}` (cache to `public/classified.json`). `/api/read?id=` →
   geographic interpretation of that petition's constituency spread. `/api/ask` chatbot grounded in the data.
5. **1:45–2:00 Polish.** Headline KPI ("Top financial-harm petition by signatures: WASPI, 161,788"),
   region ranking, join a warned-firm postcode overlay as FCA garnish, final deploy.

## Risks / fallbacks
- **Map tiles / GeoJSON fail on stage** → the hex-cartogram fallback (built from `ons_code` list, no network)
  renders the same intensity story with zero external dependency. Build it as the default; treat leaflet as
  the upgrade.
- **Claude classify fails live** → pre-bake `public/classified.json` before stage; map + chatbot degrade to
  cached labels. The choropleth itself needs no LLM.
- **Petition relevance is noisy** → this is expected and *is* the demo (Claude as filter); show a couple of
  petitions Claude *rejects* as non-financial to prove the classifier earns its keep.
- **Thin finance-specific volume / low signature counts on some petitions** → lead with the hero (WASPI 161k,
  student-loan interest 24k); frame as "where national financial grievances concentrate", not a live ticker.
- **Correlation of geography ≠ causation** → Claude hedges; present as "where the anger is loudest", not
  proof of localised harm.
- **ONS code / boundary vintage mismatch** (2024 constituencies vs older GeoJSON) → pin to the 2024
  Westminster PCON boundaries; the API already returns current `ons_code`s (e.g. `E14001063`).

## Demo script (2 min)
1. "When financial harm goes national, people sign petitions — and Parliament tells us *exactly where* they
   live." (map loads, seats glowing)
2. Pick the WASPI petition → the map lights up; hover a seat → "161k signatures, MP named".
3. Show Claude rejecting a look-alike petition ("this one's not financial — filtered out").
4. Read Claude's geographic read: "loan-charge anger over-indexes in the North East."
5. Ask the chat: "where is car-finance anger strongest?" → cited seats.
6. Punchline: "A consumer-harm heatmap the FCA could join straight onto its firm data — from public
   democratic signal it has never used."
