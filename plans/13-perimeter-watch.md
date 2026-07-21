# 13 — "Perimeter Watch": Finance-Flavoured Companies Forming Outside the FCA Net

**Non-FCA primary data** — Companies House *new incorporations* filtered to financial SIC
codes, cross-checked live against the FCA Register. Surfaces firms setting up to do
finance-shaped business that the FCA has **never authorised** — the regulatory perimeter,
watched in near-real-time from company-formation data the FCA does not systematically ingest.

## Pitch — data the FCA doesn't have
Every day, hundreds of new UK companies incorporate with names like *OXA CAPITAL*,
*AYA ASSET MANAGEMENT*, *VIZION FINANCE* and SIC codes for banking (64191), fund
management (66300) or "financial services nec" (64999). The FCA sees firms when they
**apply for authorisation**. It does *not* watch Companies House for finance-flavoured
firms that never apply — yet that gap is exactly where boiler-rooms, unauthorised
loan/investment outfits and clone-in-waiting shells are born. This tool turns the daily
incorporation feed into a **perimeter early-warning list**: new finance-SIC companies,
scored by risk, with a live FCA-Register cross-check proving they are *not* authorised.

**Verified on our baked sample (2025-06-01 to 2025-07-15):** 472 new finance-SIC
incorporations; 115 carry finance keywords in the name; 59 are "high risk"
(finance name + regulated-activity SIC + unauthorised). Live-checked 20 high-risk names
against the FCA Register — **16 confirmed with no FCA authorisation**.

## Sources — exact URLs + verified status
| Source | URL | Key? | Verified |
|---|---|---|---|
| Companies House Advanced Search | `https://api.company-information.service.gov.uk/advanced-search/companies?sic_codes={SIC}&incorporated_from=&incorporated_to=&size=100` | yes (`COMPANIES_HOUSE_API_KEY` in `.env.local`, HTTP Basic, key as username) | **YES — HTTP 200, 472 real rows pulled** |
| FCA Register (cross-check) | `https://register.fca.org.uk/services/V0.1/Search?q={NAME}&type=firm` | yes (`FCA_API_EMAIL` + `FCA_API_KEY`, headers `X-Auth-Email`/`X-Auth-Key`) | **YES — HTTP 200, live authorisation lookups** |
| Baked fixture | `data/fixtures/perimeter-incorporations.json` | — | **GENERATED — 472 companies, cross-check applied** |

Finance SIC set used: 64191 Banks, 64110 Central banking, 64929/64922 Credit granting,
64999 Financial services nec, 66190 Aux to financial services, 66300 Fund management,
66220 Insurance/pension broking.

## 2-hour build plan
1. **(0:00-0:15) Data layer.** `data/fixtures/perimeter-incorporations.json` already holds
   472 rows with `name, number, incorporated, sic_codes, nameFlagged, fcaAuthorised,
   perimeterRisk` plus a `crossCheck` block. Load it; the core view needs zero live calls.
2. **(0:15-0:35) Live enrichment (optional).** `/api/incorporations?from=&sic=` proxies the
   Companies House advanced-search endpoint (server holds the key); `/api/fca-check?name=`
   hits the FCA Register and returns authorised yes/no + matched firm. Throttle 150ms,
   3s timeout, fall back to fixture on any non-200.
3. **(0:35-1:15) Interactive visual.** One dark-theme page, linked views off `perimeterRisk`:
   - **Daily-formation timeline** — new finance-SIC incorporations per day, bar-coloured by
     risk; brush to a date range.
   - **Risk leaderboard** — sortable table, high-risk first, with a red "UNAUTHORISED" badge
     driven by the live FCA-Register cross-check; SIC chips; click a row for the Claude brief.
   - **SIC treemap / donut** — which regulated activities are forming fastest.
   - KPI tiles: new firms in window, % finance-named, high-risk count, % confirmed
     unauthorised in sampled cross-check.
4. **(1:15-1:45) Claude AI layer** (Claude key in `.env.local`):
   - **Perimeter briefing** — pass one company (name, SIC, incorporation date, officers if
     fetched, FCA-check result) to Claude with a rubric (regulated-activity SIC without
     authorisation, generic capital/wealth/fx naming, mass-registered sibling shells,
     residential/formation-agent address). Returns a 3-bullet "why this is on the perimeter".
   - **"Ask the perimeter" chatbot** — Claude gets aggregate stats + compact JSON and answers
     free-text ("which SICs spiked this month?", "show me shells registered in batches").
     Ground every answer in the passed data.
5. **(1:45-2:00) Polish, fallback wiring, dry-run.**

## Visual/tech
Static HTML + vanilla JS + inline SVG / small chart lib, Node/Express for the two proxy
endpoints and `/api/brief`. Dark theme per `design-spec.md`.

## Pre-baked fixture
`data/fixtures/perimeter-incorporations.json` — **472** finance-SIC incorporations
(2025-06-01..07-15), fields per row: `name, number, incorporated, sic_codes, address,
nameFlagged, fcaAuthorised, perimeterRisk (high|medium|low), fcaRegisterMatch`. Top-level
`counts` (total 472, nameFlagged 115, highRisk 59) and `crossCheck` (20 sampled,
16 confirmed unauthorised). Real Companies House data; FCA-Register cross-check applied live.

## Risks + fallbacks
- **Companies House key / rate limits.** 600 req / 5 min. Mitigation: fixture is the source
  of truth; live pull is a "refresh today's feed" nicety, batched by SIC.
- **FCA-Register fuzzy matches.** `Search` returns any firm containing a query word, so a few
  high-risk names showed an "authorised" match (4/20). Treat a match as *"review — possible
  name collision"*, not a clear. Tighten with exact-name + status filter if time allows.
- **"Perimeter" is a signal, not an accusation.** Frame every firm as *worth a look*, never
  *guilty*; Claude prompt must say so. Most new finance firms are legitimate pre-authorisation.
- **crt.sh-style live calls not needed here** — this idea is self-contained on two authed APIs
  both verified working this session.

## Demo script (90s)
1. Open on the daily timeline: "The FCA sees firms when they apply to be authorised. Here's
   every finance-flavoured company that *incorporated* last month — the ones it doesn't watch."
2. Sort the leaderboard to high-risk; point at *OXA CAPITAL*, *AYA ASSET MANAGEMENT*.
3. Click "FCA check" live on one row -> "No authorisation found." "Companies House says
   finance; the FCA says: never heard of them. That's the perimeter."
4. Open the Claude brief on it — 3 bullets on why it's worth a look.
5. Ask the chatbot "which finance SICs are forming fastest this month?" — grounded answer.
   Close: "Public formation data, one cross-check, a perimeter watch the FCA doesn't run today."
