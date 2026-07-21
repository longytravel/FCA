# 11 — "Born Yesterday": Scam Domain Age vs FCA Warning

**Cross-data** — FCA Warning List scam-site names JOINED with live domain-registration
records from RDAP (the WHOIS successor). Answers a question the FCA's own data can't:
*how old is a scam website when the regulator blocklists it?*

## Pitch
The FCA Warning List is full of unauthorised-firm websites (wealthfinez.com,
sigmatrapartners.live, ...). None of that data tells you when the site was born. RDAP
does. Join the two and you get a brand-new signal: the **gap between a domain's
registration date and the day the FCA warned about it**. Verified result on our sample:
the median gap is ~7 months, but **41% of warned scam domains were registered within the
last 6 months, 16 within 90 days, and the freshest was just 6 days old** — while a long
tail of *aged* domains (years old) points at legit-looking names repurposed for fraud.
The demo tells two stories at once: "scams spin up overnight" AND "watch out for the
suspiciously old domain too." Timely — several sample domains were registered in the same
week they were warned (today is 2026-07-21).

## Sources — exact URLs + verified status
| Source | URL | Key? | Verified |
|---|---|---|---|
| FCA Warning List (names) | `data/warnings-sample.json` (999 rows, 355 contain domains) | no | YES — parsed live |
| RDAP .com/.net | `https://rdap.verisign.com/com/v1/domain/{DOMAIN}` (and `/net/v1/`) | no | YES — 200, reg date |
| RDAP .org | `https://rdap.publicinterestregistry.org/rdap/domain/{DOMAIN}` | no | YES — 200 |
| RDAP bootstrap (other TLDs) | `https://rdap.org/domain/{domain}` | no | YES — 200 (rate-limited on bursts) |
| **Pre-built cache** | `data/rdap-cache.json` — 120 domains, **93 resolved with reg date** | — | GENERATED, ready |

`eventAction:"registration"` in the RDAP JSON gives the birth date; `entities[roles=registrar]`
gives the registrar. Everything is public, no auth.

## 2-hour build plan
1. **(0:00-0:15) Data layer.** `data/rdap-cache.json` already exists (93 resolved rows with
   `domain, name, dateAdded, regDate, registrar, tld, daysRegToWarn`). Load it; no live calls
   needed for the core view.
2. **(0:15-0:35) Enrichment endpoint (optional live).** `/api/rdap?domain=` — server picks the
   TLD-direct endpoint (Verisign/PIR) with a 90ms throttle and 3s timeout, falls back to the
   cache on any non-200. Never call rdap.org in a tight loop (429s).
3. **(0:35-1:15) Interactive visual.** One page, three linked views off `daysRegToWarn`:
   - **Histogram** of domain age-at-warning (buckets: <30d, 30-90d, 90-180d, 6-12m, 1-3y, 3y+).
   - **Scatter** registration date (x) vs warning date (y), coloured by TLD; points on the
     diagonal = "born and blocked in the same window". Hover shows the domain + registrar.
   - **"Freshest scams" leaderboard** — sortable table, youngest first, with a red "N days old"
     badge. Click a row to open the Claude briefing.
   - KPI tiles: median age, % under 90 days, freshest domain, most-common registrar.
4. **(1:15-1:45) Claude AI layer.** Two touch-points using the Claude key in `.env.local`:
   - **Domain briefing** — pass one record (domain, age, registrar, TLD, warning date) to
     Claude with a red-flag rubric (freshly-registered, cheap/novel TLD, privacy-proxy
     registrar, lexical tricks like "fx/crypto/assets/markets"). Returns a 3-bullet risk read.
   - **"Ask the pattern" chatbot** — Claude gets the aggregate stats + a compact JSON of the
     cache and answers free-text ("which registrars host the youngest scams?", "are .live
     domains younger than .com?"). Ground every answer in the passed data; no outside claims.
5. **(1:45-2:00) Polish + fallback wiring + demo dry-run.**

## Visual/tech
Static HTML + vanilla JS + a small chart lib already in the project (or inline SVG). Node/Express
(or the site's existing server) for `/api/rdap` and `/api/brief`. Dark theme per `design-spec.md`.

## Risks + fallbacks
- **RDAP rate limits (429).** Real: rdap.org throttles bursts (saw 80/90 fail). Mitigation:
  ship the cache as the source of truth; live enrichment is a per-click nicety, TLD-direct only.
- **Unresolved TLDs / redacted dates.** ~22% didn't resolve (404 on obscure TLDs, GDPR-redacted
  ccTLDs). Show them as "age unknown" — honest, not a crash.
- **Long-tail outliers** (a 29-year-old domain). Feature, don't hide: label as "aged domain,
  possible repurpose" — it strengthens the narrative.
- **Name→domain parsing.** Some warning names aren't domains; the parser already filters to
  valid host patterns (355/999). Non-domain warnings simply don't enter this view.
- **No-network fallback:** everything renders from `data/rdap-cache.json`; Claude calls degrade
  to a pre-written static briefing string if the API key/network is unavailable.

## Demo script (2-3 min)
1. "The FCA warns about scam websites — but its data never says how *old* the site is. Let's ask
   the internet's registration records." Open the page: KPI tiles animate in.
2. Point at the histogram: "4 in 10 of these scams were registered in the last six months —
   here's one that was **6 days old** when the FCA caught it." Click the freshest row.
3. Claude briefing pops: reads the registrar, the .live TLD, the age, flags it as a textbook
   spin-up scam in three bullets.
4. Switch to the scatter: "But look at these up here — years old. Aged, respectable-looking
   domains repurposed for fraud. Two different playbooks, one chart."
5. Type into the chatbot: "Which registrars show up most for domains under 90 days?" Claude
   answers from the data. Close: "FCA data + one public API = a fraud-freshness radar, built live."
