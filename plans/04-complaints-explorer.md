# 04 — Complaints Explorer
`AUDIT: verified 2026-07-21, by audit-1`

## Pitch
An interactive "who complains about whom" explorer: type any firm and instantly see complaint volumes,
uphold rates and 3-day/8-week closure speed across five product groups — then flip to live **league tables**
ranking best and worst by product. On top, Claude writes a plain-English **firm complaints briefing** and an
AI **market read** of the whole sector. FCA firm-level data shows how many complaints firms got; FOS data
shows how often the Ombudsman overruled them — both sides of every complaint.

## Data sources — VERIFIED (2026-07-21)
Live URLs all re-tested ✅ 200 (`.xlsx`, correct content-type). **Files already harvested in `data/complaints/`:**

| File (in repo) | Verified | Notes |
|---|---|---|
| `firm-level-complaints-2025-h2.xlsx` | ✅ 114 KB, **11 sheets confirmed** | Primary. Named firms + groups. |
| `aggregate-complaints-2025-h2.xlsx` | ✅ 82 KB, sheets: `Firm Type · Product Group · Product Specific · Notes` | Market totals/trends. |
| `fos-quarterly-complaints-Q4-2025-26.xlsx` | ✅ 20 KB, `Sheet1` | FOS named-business uphold rates (stretch join). |

**Firm workbook sheets (verified by unzip):** `Opened · Closed · Consumer Credit · Percentage within 3 days ·
Percentage after 3 days, within (8wk) · Percentage upheld · Context - Intermediation · Context - Provision ·
Trading Names · Main return Joint reporters · Consumer credit Joint reporters`.
Per firm: Firm Name, Group, Joint Reporting, Reporting period, then 5 product groups + Grand Total:
**Banking & credit cards · Decumulation & pensions · Home finance · Insurance & pure protection · Investments** (~600+ firms).

## Stack
Existing Next.js 15 scaffold (reuse). **`xlsx` (SheetJS) parses OFFLINE at build → static JSON** — never at
runtime. `recharts` charts, `@anthropic-ai/sdk` for AI. **Missing deps — install first:**
`npm i -D xlsx` and `npm i recharts @anthropic-ai/sdk`.

## 2-hour build plan
- **0:00–0:25 — Ingest & flatten (the riskiest step, do first).** `scripts/ingest.mjs`: read the 3 local
  XLSX with SheetJS. Join `Opened`/`Closed`/`Percentage upheld`/`Percentage within 3 days` on Firm Name →
  one record per firm × product `{opened, closed, upheld%, closed3day%, closed8wk%}`. Emit
  `public/data/firms.json` + `public/data/aggregate.json` (from `Product Group` sheet). **Commit both JSONs
  so the demo never parses live.** Watch merged-header rows — skip until the header row with "Firm Name".
- **0:25–0:35 — Setup.** `npm i` deps; add `ANTHROPIC_API_KEY`; static-import the JSON (no DB, no API for data).
- **0:35–1:00 — Firm lookup.** Client fuzzy search over `firms.json`. Select firm → card grid, one per
  product: opened count, uphold %, closure-speed bars. Headline: total complaints + weighted uphold rate.
- **1:00–1:25 — WOW (c) league tables + trend.** Tabbed table per product, sortable by opened / upheld % /
  closure speed, top-10 highlighted, min-volume filter. Recharts bar: market complaints by product (aggregate).
- **1:25–1:50 — WOW (a)+(b) AI layer.** `/api/briefing`: Claude (`claude-fable-5`) turns a selected firm's
  numbers into a 3-sentence read ("Bank X received 42k complaints, upholding 61% — above the banking
  average; it closes 78% within 3 days…"). `/api/chat`: ask "which firm has the worst pension uphold rate?"
  over a compact JSON summary. **Pre-generate static fallbacks for the demo firm + questions at build.**
- **1:50–2:00 — Deploy.** `vercel --prod`. Static JSON → instant, offline-safe.

## Risks & fallbacks
- **XLSX parse quirks (merged headers, footnotes)** → commit generated JSON; demo never parses live. This is
  the #1 stage risk — run `ingest.mjs` and eyeball the JSON well before the demo.
- **FCA↔FOS name matching is fuzzy** → drop the FOS join, keep FCA-only (still complete). FOS is stretch.
- **Claude API fails live** → briefing + chat fall back to build-time pre-generated text; explorer + tables +
  chart fully work without AI.
- **Network during demo** → everything static in `public/`; works offline via `next build && next start`.
- **Data revisions** → FCA revised H1/H2 2025 on 15 May 2026; show "as published" date in footer.
- **Scope creep** → firm lookup + one league table is the MVP; trends, FOS, AI cut first if behind.

## Demo script (~5 min)
1. "Every 6 months the FCA publishes a complaint record for every regulated firm — all ~600, here." Open app.
2. Type a well-known bank → product cards, uphold rate, closure speed; **Claude's briefing writes itself.**
3. League table, sort by uphold % → "who loses the most complaints, by product."
4. Market trend chart → "the whole market at a glance."
5. **Ask Claude "worst pension uphold rate?"** → grounded answer. (Stretch) FOS overlay.
6. Close: "Two hours, three public spreadsheets, an AI analyst, zero backend — static on Vercel."
