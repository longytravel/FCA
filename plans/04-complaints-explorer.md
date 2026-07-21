# 04 — Complaints Explorer

## Pitch (wow-factor)
An interactive "who complains about whom" explorer for UK financial services: type any firm name and instantly see its complaint volumes, uphold rates and 3-day/8-week closure speed across five product groups — then flip to live **league tables** ranking the worst (and best) firms by product. Because the FCA data is firm-level and the Financial Ombudsman data shows what happens when firms say no, we can show both sides of every complaint: how many a firm got, and how often the Ombudsman overruled them.

## Data sources (all verified 2026-07-21)

| Source | URL | Status | Size | Notes |
|---|---|---|---|---|
| FCA firm-level complaints 2025 H2 (XLSX) | https://www.fca.org.uk/publication/data/firm-level-complaints-data-2025-h2.xlsx | ✅ 200 | 111 KB | **Primary.** Named firms + groups. |
| FCA aggregate complaints 2025 H2 (XLSX) | https://www.fca.org.uk/publication/data/aggregate-complaints-data-2025-h2.xlsx | ✅ 200 | 80 KB | Market totals/trends; firms <500 complaints. |
| FOS quarterly complaints Q4 2025/26 (XLSX) | https://www.financial-ombudsman.org.uk/files/324774/Quarterly-complaints-data-Q4-2025-26.xlsx | ✅ 200 | 20 KB | Complement: named-business uphold rates. |
| FCA complaints hub (source page) | https://www.fca.org.uk/data/complaints-data | ✅ 200 | — | Links to previous periods for time series. |

**FCA firm workbook structure (verified by unzip):** 11 sheets —
`Opened`, `Closed`, `Consumer Credit`, `Percentage within 3 days`, `Percentage after 3 days, within` (8wk), `Percentage upheld`, `Context - Intermediation`, `Context - Provision`, `Trading Names`, `Main return Joint reporters`, `Consumer credit Joint reporters`.
Columns per firm: Firm Name, Group, Joint Reporting, Reporting period, then 5 product groups + Grand Total:
**Banking and credit cards · Decumulation & pensions · Home finance · Insurance & pure protection · Investments**. ~600+ named firms.

## 2-hour build plan (Next.js on Vercel, pre-processed JSON)

**T+0:00 — Ingest & flatten (25 min)**
- `scripts/ingest.mjs`: download the 3 XLSX (already verified). Parse with `xlsx` (SheetJS).
- Join `Opened` / `Closed` / `Percentage upheld` / `Percentage within 3 days` sheets on Firm Name into one record per firm × product.
- Emit `public/data/firms.json` (array: firm, group, per-product {opened, closed, upheld%, closed3day%, closed8wk%}) and `public/data/aggregate.json` (market totals per product). Keep FOS join optional (match on business/group name) → `fos.json`.

**T+0:25 — Scaffold (15 min)**
- `npx create-next-app` (App Router, TS, Tailwind). Static-import JSON — no DB, no API routes.

**T+0:40 — Firm lookup (25 min)**
- Search box (client-side fuzzy filter over firms.json). Selecting a firm → card grid: one card per product group with opened count, uphold %, closure-speed bars. Headline stat: total complaints + weighted uphold rate.

**T+1:05 — League tables (30 min)**
- Tabbed table by product group, sortable by opened / upheld % / closure speed (matches FCA's own sort dimensions). Highlight top 10. Min-volume filter to avoid tiny-firm noise.

**T+1:35 — Trends + polish (20 min)**
- Bar chart: market-level complaints by product (aggregate.json). If time: pull one prior period for a 2-point trend. Recharts. Dark theme, FCA-neutral palette, number formatting.

**T+1:55 — Deploy (5 min)** — `vercel --prod`. Data is static, so deploy is instant and offline-safe once JSON is committed.

## Risks & fallbacks
- **XLSX parse quirks** (merged headers, footnote rows): commit the generated JSON to the repo so the demo never depends on live parsing. Fallback = ship with pre-baked `firms.json`.
- **Firm-name matching FCA↔FOS** is fuzzy (legal entity vs brand). Fallback: drop the FOS join, keep FCA-only (still a complete demo). FOS is the stretch, not the spine.
- **Network during live demo**: everything is static JSON in `public/` — works fully offline via `next build && next start`.
- **Data revisions**: FCA revised H1/H2 2025 on 15 May 2026 — note "as published" date in the UI footer.
- **Scope creep**: firm lookup + one league table is the MVP; trends and FOS are cut-first if behind.

## Demo script (5 min)
1. "Every 6 months the FCA publishes a complaint for every regulated firm. Here's all ~600 of them." Open app.
2. Type a well-known bank → its product cards, uphold rate, closure speed. "This is public but nobody sees it like this."
3. Flip to **league table**, sort by uphold % → "Here's who loses the most complaints, by product."
4. Show market trend chart → "And here's the whole market moving over time."
5. (Stretch) Toggle FOS overlay → "…and when firms said no, here's how often the Ombudsman disagreed."
6. Close: "Two hours, three public spreadsheets, zero backend — all static on Vercel."
