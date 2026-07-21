# Enforcement Insights — FCA Fines Dashboard
`AUDIT: verified 2026-07-21, by audit-1`

## Pitch
An interactive dashboard of every FCA fine 2013–2025: total penalties by year, biggest fines, sector and
breach-type breakdowns, and a searchable ledger of every notice deep-linked to its Final Notice — plus a
Claude **"Ask the enforcement data"** box and an AI-written **year-in-review insight** for whatever the user
filters to. Thirteen scattered tables become a living, conversational picture of enforcement.

## Data sources — VERIFIED (2026-07-21)
Scheme: `https://www.fca.org.uk/news/news-stories/{YEAR}-fines`
- Re-tested live: `2025-fines` ✅ 200 (176 KB HTML table), `2013-fines` ✅ 200 (182 KB). Range **2013–2025 = 13 years**.
- Pre-2013 lives on legacy FSA archive (different scheme) — out of scope, mention as fast-follow.

**Pre-harvested & ready — `data/fines.json` (confirmed):**
- **300 records**, fields: `year, firm, date, amount, reason, noticeUrl, isCourtFine`.
- `amount` already parsed to int; `date` is `DD/MM/YYYY`; `noticeUrl` links the Final Notice/press release.
- ⚠ Plan's old field name `sourceUrl` → actual is **`noticeUrl`**. `sector`/`breachType` are NOT in the
  file yet — derive them at load time by keyword-tagging `reason` (dictionary below). **App reads this static
  JSON, never scrapes at runtime.**

### Tagging (do at load, in-memory)
- **Sector** keywords: `retail bank|pensions|investment bank|issuer|insurance|consumer credit|asset management`.
- **Breach** keywords: `PRIN|APER|COCON|market abuse|LIBOR|listing rule|SYSC|financial crime|money laundering`.
- Default bucket "Other". Charts are labelled "indicative".
- `isCourtFine=true` → exclude from headline FCA-imposed total, show with an asterisk.

## Stack
Existing Next.js 15 scaffold (reuse — no `create-next-app`). `recharts` for charts, `@anthropic-ai/sdk` for
the AI layer. **Missing deps — install first:** `npm i recharts @anthropic-ai/sdk`. All data static JSON —
zero runtime dependency on fca.org.uk, so the live site can't break mid-demo.

## 2-hour build plan
- **0:00–0:15 — Setup.** Reuse scaffold; `npm i recharts @anthropic-ai/sdk`; add `ANTHROPIC_API_KEY`.
  Copy `data/fines.json` → `public/data/`. Sanity-check: sum by year, eyeball 2013 ≈ £474m spike.
- **0:15–0:35 — Load + tag.** `lib/fines.ts`: import JSON, add `sector`/`breachType` tags, helpers for
  year totals, top-10, sector/breach aggregates.
- **0:35–1:00 — WOW (c) hero + charts.** KPI cards: total fined since 2013, biggest single fine (click →
  `noticeUrl`), notice count, worst year. **Recharts** bar of total £ by year (2013 LIBOR spike reads instantly).
- **1:00–1:25 — WOW (c) breakdowns + ledger.** Sector bar + breach donut (off the tags). Searchable table:
  text search on firm+reason, year/sector filters, sort by amount, rows deep-link to the Final Notice PDF.
- **1:25–1:50 — WOW (a)+(b) the AI layer.** `/api/chat`: Claude (`claude-fable-5`) answers questions over a
  compact JSON summary of the 300 rows stuffed in context ("Which year had the most financial-crime fines?").
  Plus `/api/insight`: whenever the user filters (e.g. year=2013), Claude writes a 2-sentence takeaway for
  that slice. **Both pre-generate a static fallback for the demo filters/questions at build.**
- **1:50–2:00 — Deploy** to Vercel, smoke-test live URL.

## Risks & fallbacks
- **Tagging is fuzzy** → "Other" bucket; charts labelled "indicative", never precise.
- **Court/non-FCA fines skew totals** → `isCourtFine` excluded from headline, asterisk note.
- **Multi-firm rows** (2013 Lloyds TSB + BoS share a row) → treat as one record; acceptable for demo.
- **Claude API fails live** → chat + insight fall back to build-time pre-generated answers for the demo
  questions; dashboard + charts + table are fully functional without AI (complete MVP on their own).
- **Site offline during demo** → data pre-harvested and committed; nothing fetched live.
- **Time overrun** → cut donut + AI insight first; KPIs + year bar + searchable table is a strong MVP.

## Demo script (the "vibe")
1. "13 years of every FCA fine — on your own site, but locked in 13 tables." Open the dashboard.
2. Headline: total £ since 2013, biggest ever — click through to its Final Notice.
3. Year bar chart → "2013 LIBOR era spikes."
4. Sector + breach donut → "Which sectors, which breaches."
5. Live search "financial crime" or "Barclays" → table filters, each row deep-links to the notice.
6. **Ask Claude "which year was toughest on financial crime?"** → grounded answer over the data.
7. Close: "Two hours, entirely public data — a self-service insight layer over any FCA dataset."
