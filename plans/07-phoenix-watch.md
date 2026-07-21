# 07 — Phoenix Watch (FCA enforcement × Companies House)

> **★ CHOSEN BUILD (2026-07-21).** This is the demo we are building. See `HANDOFF.md` at repo root.

> **AUDIT: verified 2026-07-21, by audit-2.** CH key in `.env.local` works. Full phoenix chain
> re-tested live: `search/companies` → `/company/{num}/officers` → `/officers/{id}/appointments` all 200.
> Example resolved on stage-quality data: "Blackmore Bond PLC" → num 10273135 (liquidation) → officer
> McCreesh, Patrick → appointments endpoint returns their other companies. `data/fines.json` = 300 fined
> firms with dates/amounts/URLs. **Wow layer upgraded — was zero-AI; now Claude narrative + chatbot + graph.**
>
> **PRE-BAKED FIXTURE (2026-07-21, data-prep): `data/fixtures/phoenix-graph.json`** — the full resolved
> graph is already built. 159 nodes (126 companies + 33 officers), 166 edges, ready for react-force-graph.
> Covers the 3 phoenix demo firms (Blackmore Bond 10273135, London Capital & Finance 08140312, Basset &
> Gold 05433451) with officers + their other appointments, plus 5 high-confidence fined seed firms.
> Node fields: `id, type (company|officer), name, status, incorporated_on, dissolved_on, tags` (tags
> include `phoenix-seed`/`fined-seed`/`linked`; 118 `linked` companies, 34 active = the phoenix signal).
> Edge fields: `source (officerId), target (companyNumber), role, appointed_on, resigned_on`.
> **Load this at build time; the live CH chain below is now the "if time permits" enhancement only.**

## Pitch
The FCA fines or blacklists a firm, but its directors quietly resurface running brand-new companies.
Phoenix Watch cross-references FCA fined / Warning-List firms against Companies House officer records
to expose directors whose old firm was shut down while they already control freshly incorporated ones —
the "phoenix" pattern regulators hate. Live on stage: type a fined firm, watch its directors light up a
network graph of their *other* active companies, and Claude writes the risk verdict.

## Wow layer (mandatory — lands all three)
- **(c) Interactive visual:** force-directed graph firm→directors→other companies. Red nodes = companies
  `active` or `incorporated_on` AFTER the fined firm's fine/dissolution date (the phoenix signal).
- **(b) AI briefing:** for the selected firm, Claude writes a 3-sentence "phoenix risk assessment" from
  the officer/appointment JSON — which directors resurfaced, when, into what.
- **(a) Claude chatbot:** "Ask about this network" — chat grounded in the resolved graph JSON. "Which
  director is highest risk and why?" → cited answer naming companies + dates.

## Data sources (re-verified 2026-07-21)
| Source | URL | Access | Verified |
|--------|-----|--------|----------|
| FCA fines 2013–25 | `data/fines.json` (300 firms, team-harvested) | local JSON | ✅ 300 rows, has firm/date/amount/URL |
| FCA Warning List | `data/warnings-latest.xml` + `data/warnings-sample.json` | local | ✅ present |
| Companies House REST API | `https://api.company-information.service.gov.uk` — `/search/companies?q=`, `/company/{num}`, `/company/{num}/officers`, `/officers/{id}/appointments` | key in `.env.local` (`COMPANIES_HOUSE_API_KEY`, basic auth, key as username, empty pw) | ✅ 200 live, full chain works |
| CH advanced-search (fallback, NO key) | `https://find-and-update.company-information.service.gov.uk/advanced-search/get-results?companyNameIncludes=…&companyStatus=dissolved` | HTML scrape | ✅ 200 |

Auth: `Authorization: "Basic " + Buffer.from(key + ":").toString("base64")`. Rate limit 600 req/5min.

## 2-hour build (Next.js + Vercel)
1. **0:00–0:15** `create-next-app`, deploy skeleton. Env: `COMPANIES_HOUSE_API_KEY`, `ANTHROPIC_API_KEY`.
   Server route `/api/ch` proxies CH (basic auth). Never call CH from the browser.
2. **0:15–0:45 (DONE — use fixture).** Load `data/fixtures/phoenix-graph.json` directly (copy to
   `public/`). The officer + company resolution is already pre-baked (see fixture note above).
   *If time permits:* re-run the live build script — for each FCA fined firm `search/companies` → best
   match → `/company/{num}/officers` → officer IDs + `resigned_on` + status — to add more firms.
3. **0:45–1:15 (DONE — use fixture).** Officer `appointments` → other companies + phoenix flags are
   already in the fixture (`linked` tag + `status`). *If time permits:* extend live to more officers.
4. **1:15–1:35** UI graph: `react-force-graph-2d` (npm, bundled — do NOT rely on CDN at the venue).
   Firm→directors→other companies; red = active post-fine. Searchable firm list → click → graph blooms.
5. **1:35–1:55** AI layer: `/api/verdict` (Claude briefing from the firm's cached JSON) + `/api/ask`
   (streaming chatbot grounded in the same JSON). Pre-compute verdicts for the 3 demo firms.
6. **1:55–2:00** Deploy, smoke-test 3 juicy examples, write patter.

## Risks / fallbacks
- **Chatbot/AI fails live** → pre-computed verdict text stored in `cache.json` per firm; the "AI verdict"
  card renders from cache even if the API is down. Chat degrades to the static verdict.
- **API key friction / rate limit** → everything pre-baked to `data/fixtures/phoenix-graph.json`; live app reads from disk, no CH calls needed on stage.
- **Name-matching noise** (FCA names ≠ CH legal names) → hand-pick the 30 seed firms; show match confidence.
- **Warning-List firms often unregistered** (clone scams) → that's a *feature* ("not even a real company"),
  but lead with genuine fined firms that DO resolve (Blackmore Bond is a clean, dramatic example).
- **`react-force-graph` CDN flakiness** → install as a dep and bundle; no runtime CDN.

## Demo script (90 sec)
"The FCA fined [Firm X] and it collapsed. So that's over, right?" → search it → graph blooms → red nodes →
"Its finance director? Still running these three companies incorporated after the collapse." → Claude's
verdict card reads the risk aloud → type into chat "who's highest risk here?" → cited answer. "Two free
public datasets nobody joins — joined, mapped, and reasoned over in two hours."
