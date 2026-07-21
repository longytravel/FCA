# FCA Live-Build Plan Audit

## Executive summary

**Best immediate choice: Plan 03 — Enforcement Insights.** It is the only idea with a clean, usable, static primary dataset already present: `data/fines.json` has 300 records spanning 2013–2025. It can be impressive without live services, AI, or a complex data join.

The plans broadly overestimate what fits in two hours because most allocate the entire window to feature work and leave only 5–10 minutes for deployment and rehearsal. Several also claim offline fallbacks that have not actually been pre-harvested into `data/`.

Actual available data:

| File | Actual shape |
|---|---|
| `data/fines.json` | 300 objects, fields: `year`, `firm`, `date`, `amount`, `reason`, `noticeUrl`, `isCourtFine`; 2013–2025 |
| `data/warnings-sample.json` | 999 objects, fields: `name`, `dateAdded`, `dateUpdated`; dates 2019-12-17 to 2026-07-20 |
| `data/warnings-latest.xml` | RSS feed with 20 `<item>` elements; title, link, description, pubDate, creator, guid |
| `data/handbook-prin2a.json` | 72 objects, fields: `section`, `ref`, `type`, `text`; PRIN 2A.1.3–2A.11.1 |
| `data/complaints/aggregate-complaints-2025-h2.xlsx` | Aggregate time series: Firm Type (561 rows), Product Group (481), Product Specific (1,051) |
| `data/complaints/firm-level-complaints-2025-h2.xlsx` | Firm-level workbook with 11 sheets; main product sheets each have 220 rows including header |
| `data/complaints/fos-quarterly-complaints-Q4-2025-26.xlsx` | One 235-row aggregate product-level sheet; **not a firm-level FOS dataset** |

## Plan 01 — FCA Register Explorer

- **Time realism:** Not credible in two hours. It budgets 15 minutes for API registration, environment setup and an authenticated smoke test, then builds search, firm-detail tabs, three data helpers and a tool-using chatbot. Any authentication, response-shape, or deployment issue consumes the whole buffer.

- **Data dependency:** No Register API fixtures are present in `data/`. The plan’s own verified call only established a 403 without headers; it did not validate authenticated response shapes. The required live key, network access and API availability are therefore critical-path dependencies.

- **Fallback gap:** The plan proposes cached fixtures for Barclays, Monzo and Revolut, but those fixtures do not exist locally. “Show cached data” is not a fallback until the files are committed and the UI is tested in offline mode.

- **Wow-factor gap:** A searchable register is useful but familiar. Make the single firm page land harder with a deterministic “regulatory posture” briefing: status, permissions, disciplinary history and explicit provenance for each statement. Do not let a chatbot become the centrepiece unless its tool calls and source evidence are visibly rendered.

## Plan 02 — Scam Radar

- **Time realism:** Borderline after a scope cut. The planned scrape of 150 warning-list pages, category heuristics, charts, live RSS, search, polish and deployment is too much. The static dataset already exists, so do not scrape during the build.

- **Data dependency:** `warnings-sample.json` contains 999 records, not the planned approximately 3,750-record corpus. It is sufficient for search and a trend chart, but must be labelled a sample/snapshot. `warnings-latest.xml` contains exactly 20 RSS items, enough for a ticker but not a sustained live feed history.

- **Fallback gap:** The plan’s fallback refers to committed `warnings.json`; the available file is named `warnings-sample.json` and has a different, smaller scope. Wire that exact file before the build starts, and show a visible “snapshot through 20 July 2026” label if RSS fails.

- **Wow-factor gap:** The threat-console aesthetic risks being more consumer dashboard than regulator tool. Add a “why this is concerning” evidence panel for a selected warning—date added, update history, domain-pattern flags and a clear disclaimer that absence is not clearance.

## Plan 03 — Enforcement Insights

- **Time realism:** **Realistic and the strongest plan.** The static source is already ready. The planned KPIs, year chart, searchable table and top-ten list fit in two hours if sector/breach classification is a small, explicit keyword map—not an ambitious enrichment exercise.

- **Data dependency:** `fines.json` is usable: 300 rows for 2013–2025 with amount, reason, notice URL and `isCourtFine`. However, it does **not** contain the plan’s proposed `sector`, `breachType`, or `sourceUrl` fields; it uses `noticeUrl`. The plan’s expectation of roughly 400 records is inaccurate.

- **Fallback gap:** This is the best fallback posture: static JSON removes runtime network risk. Add a validation badge showing record count, date range and that court fines are excluded from the FCA headline total where appropriate.

- **Wow-factor gap:** Charts alone will feel like a competent dashboard. Make a selected fine open a “case lens”: fine amount versus year median, reason excerpt, court-fine treatment, and a direct Final Notice link. That creates an evidence-led investigative interaction rather than generic BI.

## Plan 04 — Complaints Explorer

- **Time realism:** Too ambitious as written. Parsing three workbooks, flattening and joining sheets, fuzzy firm search, league tables, trends, optional FOS matching and deployment is not a safe two-hour build. The minimum viable version is firm lookup plus one FCA-only league table.

- **Data dependency:** The source files exist, but their shapes undermine the claimed simple join. `firm-level-complaints-2025-h2.xlsx` has separate Opened, Closed, Percentage-within-3-days and Percentage-upheld sheets, plus a distinct Consumer Credit sheet. The FOS workbook is only aggregate `Product group`, `Product`, `New complaints`, `Uphold rate`; it has no firm name, so the promised FCA-to-FOS firm join cannot be built from this data.

- **Fallback gap:** The plan says pre-baked `firms.json` is the fallback, but no generated JSON exists in `data/`. Produce and commit it before the live build or remove the ingestion step from the demo scope.

- **Wow-factor gap:** “Worst firms” league tables can be misleading without volume and reporting-context controls. Add a minimum-volume slider, clear denominator/provenance labels, and a firm card that explains the measures rather than merely ranking organisations.

## Plan 05 — Ask the Handbook

- **Time realism:** Viable only if the local corpus replaces the proposed Playwright scrape entirely. A new chatbot route, streaming UI, deployment and three rehearsed questions can fit; scraping and normalising Handbook pages cannot safely coexist with that work.

- **Data dependency:** `handbook-prin2a.json` is a good compact corpus: 72 records across PRIN 2A.1–2A.11. But its schema is `{section, ref, type, text}`—not the plan’s `{code, text, url}`—and it has no source URL or effective-date field. The promised clickable citations and “as of” display cannot be delivered from the supplied data without deriving URLs and explicitly documenting that derivation.

- **Fallback gap:** Static text prevents a scraping failure, not an AI/API failure. The plan needs deterministic offline answer cards for the three demo questions, each assembled from the stored `ref` and `text`, plus a clear “scoped to PRIN 2A only” boundary.

- **Wow-factor gap:** A generic chatbot is not enough for senior regulators. The differentiator is **verifiable grounding**: highlight the exact quoted passage, provision reference, scope boundary and confidence that the answer is limited to the supplied corpus.

## Plan 06 — Regulatory Pulse

- **Time realism:** Not credible. It includes RSS ingestion, content normalisation, batch LLM enrichment, a second narrative call, a grounded chatbot, heatmap UI and deployment. The schedule leaves essentially no contingency.

- **Data dependency:** No FCA publications RSS snapshot or `data/items.json` exists. The only local RSS file is `warnings-latest.xml`, a 20-item Warning List feed, not a broad regulatory-publications corpus. The stated theme heatmap therefore has no supplied evidence base.

- **Fallback gap:** The plan claims a committed `data/items.json` fallback, but it is absent. Its canned Q&A fallback is also absent. Without both, the entire concept depends on live fetches and an AI API.

- **Wow-factor gap:** A heatmap of model-assigned themes can look decorative and un-auditable. To land with this audience, each heatmap cell needs source count, publication links and an explanation of the classification rule. Otherwise use Plan 02’s warning data and rename it honestly as a consumer-risk pulse.

## Plan 07 — Phoenix Watch

- **Time realism:** High risk. This is a cross-system entity-resolution project disguised as a dashboard: FCA name selection, Companies House lookup, officer retrieval, appointment graphing, confidence scoring and UI in two hours is unrealistic.

- **Data dependency:** Fines and warnings are present locally, but there is no Companies House API key, cached API response, company-number mapping, officer graph or hand-picked seed list in `data/`. The plan’s 30 clean seed matches are proposed work, not pre-harvested data.

- **Fallback gap:** `cache.json` is promised but absent. The no-key Companies House HTML fallback only supports a much smaller result—company status/number—not the officer/appointment graph that supplies the wow moment.

- **Wow-factor gap:** The phrase “phoenix” carries a strong allegation. Make it a transparent “potential continuity signal” view, show the match confidence and evidence chain, and avoid presenting name similarity as a finding of wrongdoing.

## Plan 08 — Scam & Sanctions Heatmap

- **Time realism:** Not feasible in two hours. It requires company resolution, postcode extraction, geocoding, sanctions ingestion/matching, deprivation data, map rendering and offline mapping safeguards.

- **Data dependency:** Only the fine and warning datasets are available. There is no Companies House cache, postcode dataset, `points.json`, OFSI consolidated list, ONS/Nomis extract, or offline UK GeoJSON. The plan explicitly cites a 16.6 MB OFSI CSV, but it has not been pre-harvested.

- **Fallback gap:** Both core fallbacks—static `points.json` and a bundled GeoJSON basemap—are absent. The map will fail on venue Wi-Fi and the data join will not exist even if tiles load.

- **Wow-factor gap:** A map with sparse or seeded sanctions hits risks looking contrived. For a regulator audience, a transparent entity-resolution workbench with match rules, false-positive controls and provenance would be more credible than a visually busy heatmap.

## Plan 09 — UK Financial Harm Map

- **Time realism:** Not feasible as a live two-hour build. The plan needs Register/API address enrichment, postcode geocoding, geographic aggregation, deprivation data, a map and an AI briefing layer.

- **Data dependency:** No geocoded `geo.json`, Register fixtures, FCA API key, postcode lookup results, ONS extract, IMD data or UK basemap is available. `fines.json` lacks registered-office postcode/FRN fields; `warnings-sample.json` has only name and dates. Those files cannot produce map points.

- **Fallback gap:** The plan names `public/geo.json` as the primary safety net, but it does not exist. The proposed use of Register API addresses introduces another live dependency with no fixture data.

- **Wow-factor gap:** This is the most visually striking idea but has the most serious analytical risk. A company registered-office location is not where consumer harm occurred; layering it over English deprivation can imply a relationship the data does not establish. If ever built, call it an “organisation-location coverage map,” limit the geography honestly, and separate observed data from model commentary.

## Plan 10 — Rate Shock & Consumer Distress Timeline

- **Time realism:** Borderline in principle, but not with the current data package. Building an aligned time series from Bank Rate, FCA aggregates and warning dates, then adding narrative AI and polished interaction, is too much unless the series is already precomputed.

- **Data dependency:** Complaints data exists and includes aggregate historical semesters from 2021 H1 onward. Warning dates span 2019–2026 in the 999-record sample. But no Bank of England rate CSV, aligned quarterly/monthly series, category crosswalk, or precomputed captions exists. The fines data ends in 2025, so it cannot support a “to today” enforcement overlay.

- **Fallback gap:** The plan promises `public/rate.json` and three precomputed captions; neither is present. It therefore still relies on a live Bank of England fetch and an LLM during the demo.

- **Wow-factor gap:** The timeline can land strongly if it is framed as an **association explorer**, never a causal engine. Show the data-frequency mismatch, source provenance and a fixed “what this does not prove” note beside the AI narrative.

## Three most serious issues across all plans

1. **The fallback datasets mostly do not exist.** Plans 01, 04, 06, 07, 08, 09 and 10 promise committed fixtures such as Register responses, `firms.json`, `items.json`, `cache.json`, `points.json`, `geo.json` and `rate.json`; none are in the supplied `data/` package.

2. **Several “two-hour” plans contain a hidden data-engineering project.** Entity resolution, web scraping, XLSX normalisation, geocoding, sanctions matching and time-series alignment are not presentation work. They are the build, and should have been completed before the two-hour session.

3. **The highest-wow concepts create the highest regulatory-defensibility risk.** AI answers need deterministic source display; maps must not turn registered offices into harm locations; and the rate timeline must not imply causation. Senior regulators will notice these caveats immediately.

## Final ranking: demo impact versus delivery risk

| Rank | Plan | Assessment |
|---:|---|---|
| 1 | **03 — Enforcement Insights** | Static, clean local data and a compelling evidence-led dashboard; only lightweight tagging is missing. |
| 2 | **02 — Scam Radar** | Good local warning snapshot plus a 20-item RSS feed; cut live scraping and label the 999-record corpus honestly. |
| 3 | **05 — Ask the Handbook** | Strong AI moment with a real 72-record corpus, provided citations are grounded and deterministic fallbacks replace API dependence. |
| 4 | **04 — Complaints Explorer** | Valuable regulator use case with real data, but ship FCA-only lookup and one league table; abandon the impossible firm-level FOS join. |
| 5 | **10 — Rate Shock & Consumer Distress Timeline** | Excellent narrative potential, but only after precomputing the BoE and aligned time-series layer. |
| 6 | **01 — FCA Register Explorer** | Relevant but live-key/API dependency and broad feature scope make it unsafe for this afternoon. |
| 7 | **06 — Regulatory Pulse** | Good concept, but its actual publication dataset and offline fallback are missing. |
| 8 | **07 — Phoenix Watch** | Powerful investigative idea, but entity resolution and Companies House graphing exceed the timebox. |
| 9 | **09 — UK Financial Harm Map** | High visual impact, but no geospatial data is pre-harvested and the proposed inference is analytically unsafe. |
| 10 | **08 — Scam & Sanctions Heatmap** | The most dependencies, absent datasets and matching risk; unsuitable for a two-hour live build. |
