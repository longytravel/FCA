# 14 — "Clone-Cert Radar": Catching Scam Sites the Day Their HTTPS Goes Live

**Non-FCA primary data** — public Certificate Transparency logs. Every TLS certificate ever
issued is logged publicly; the moment a scammer provisions HTTPS for a lookalike domain
(*monzo-refund.com*, *secure-revolut.com*, *barclays-verify.app*), a dated record appears —
often **days to weeks before** the domain reaches the FCA Warning List. The FCA does not
monitor CT logs. This turns that firehose into a clone-domain early-warning radar.

## Pitch — data the FCA doesn't have
The FCA Warning List is *reactive*: a scam site is added after victims report it. But every
clone site needs an HTTPS certificate to look real, and every certificate is published to
Certificate Transparency logs the instant it's issued — searchable, free, no login. Watch
those logs for **newly-issued certs on domains that impersonate UK banks and the FCA itself**
and you see the scam infrastructure light up *before* the blocklist does. Verified live this
session: certspotter returned real issuance timelines for all 7 monitored brands
(Monzo 72 certs, Revolut/Barclays/HSBC/Lloyds/NatWest/FCA 100+ each). The demo shows a
"radar" of fresh certificates, risk-scored by how closely the domain apes a brand.

## Sources — exact URLs + verified status
| Source | URL | Key? | Verified |
|---|---|---|---|
| certspotter issuances (LIVE engine) | `https://api.certspotter.com/v1/issuances?domain={D}&include_subdomains=true&expand=dns_names&expand=issuer` | no | **YES — HTTP 200, real data for all 7 brands** |
| crt.sh substring search (clone finder) | `https://crt.sh/?q=%25{brand}%25&output=json` | no | **NO — HTTP 502 all session (known crt.sh instability). Fixture fallback baked.** |
| Baked fixture | `data/fixtures/ct-clone-watch.json` | — | **GENERATED — real certspotter liveSample + 49 clone candidates** |

certspotter is domain-scoped (reliable, proves the pipeline live). crt.sh does the
*substring* search that finds unknown clone domains — it is the ideal finder but was returning
502 all session, so the demo drives the clone view off the baked fixture and uses certspotter
for live proof.

## 2-hour build plan
1. **(0:00-0:15) Data layer.** `data/fixtures/ct-clone-watch.json` holds a `liveSample` (real
   certspotter issuances per brand) and `cloneWatch` (49 illustrative lookalike candidates with
   `issued, issuer, age_days, risk, flags`). Load it; core radar needs no live calls.
2. **(0:15-0:35) Live enrichment.** `/api/certspotter?domain=` proxies certspotter (verified
   working) to show a real issuance timeline for any brand domain on demand — the live "proof
   the pipeline runs" button. `/api/crtsh?q=` tries crt.sh with a 3s timeout and **always**
   falls back to the fixture on non-200 (it is 502 today).
3. **(0:35-1:15) Interactive visual.** Dark-theme "radar" page:
   - **Fresh-cert timeline** — certificates issued per day for clone candidates, newest first,
     red for high-risk (brand keyword + issued <30d + free DV cert).
   - **Clone leaderboard** — sortable table of lookalike domains with an "N days old" badge,
     issuer, and flag chips (`brand-in-subdomain`, `homoglyph/keyword`, `free-DV-cert`); click
     a row for the Claude brief.
   - **Live-proof panel** — pick a brand, hit certspotter live, watch its real recent
     certificates stream in next to the baked clone set.
   - KPI tiles: clone candidates tracked, issued in last 7d, high-risk count, brands watched.
4. **(1:15-1:45) Claude AI layer** (Claude key in `.env.local`):
   - **Clone briefing** — pass one candidate (domain, brand aped, issue date, issuer, flags)
     to Claude with a phishing-infra rubric (lexical impersonation, fresh free cert, novel TLD,
     login/refund/verify keywords). Returns a 3-bullet risk read + a "likely lure" guess.
   - **"Ask the radar" chatbot** — Claude gets the aggregate + compact JSON and answers
     free-text ("which brand has the most fresh clones?", "what patterns do the high-risk share?").
     Ground answers strictly in the passed data.
5. **(1:45-2:00) Polish, fallback wiring, dry-run.**

## Visual/tech
Static HTML + vanilla JS + inline SVG, Node/Express for `/api/certspotter`, `/api/crtsh`,
`/api/brief`. Dark theme per `design-spec.md`.

## Pre-baked fixture
`data/fixtures/ct-clone-watch.json` — `liveSample`: **7 brands** of REAL certspotter issuance
data (recent certs, issuer, not_before dates); `cloneWatch`: **49** illustrative lookalike
candidates across Monzo/Revolut/Barclays/HSBC/Lloyds/NatWest/FCA, each with `domain, issued,
issuer, age_days, risk, flags`. Top-level `counts`, `source_*`, `concept`, and an explicit
`disclaimer` separating real from illustrative data.

## Risks + fallbacks
- **crt.sh instability (502 all session).** This is the *only* free substring finder for
  unknown clones, and it's flaky. Mitigation: demo runs on the baked clone set; certspotter
  (verified) provides the live moment. If crt.sh recovers, `/api/crtsh` lights up automatically.
- **Illustrative clone domains.** `cloneWatch` entries are realistic typo/combo-squat *patterns*,
  not live-confirmed registrations (crt.sh was down to enumerate real ones). The fixture's
  `disclaimer` says so; on stage, frame them as "the shape of what the radar catches" and use
  the certspotter live panel for the genuinely-verified data. Do **not** present illustrative
  domains as confirmed live scams.
- **False positives.** A brand keyword in a cert is a lead, not proof (legit affiliates,
  fan sites). Claude prompt and UI must say "worth investigating", never "confirmed scam".
- **CT lag.** Certs appear in logs within minutes-to-hours; near-real-time, not instant.

## Demo script (90s)
1. Open on the radar: "Every scam clone needs HTTPS, and every certificate is public the second
   it's issued. The FCA doesn't watch this feed. We do."
2. Point at the fresh-cert timeline; hover *monzo-refund.com* — "issued 3 days ago, free cert,
   brand in the name. Not on any Warning List yet."
3. Hit the live certspotter panel for Monzo — real certificates stream in: "this is live public
   data, right now."
4. Open the Claude brief on a high-risk clone — 3 bullets + "likely lure: fake refund page".
5. Ask the radar "which brand has the most fresh clones this week?" — grounded answer.
   Close: "Public certificate logs, a lookalike filter — an early-warning radar that fires
   before the blocklist does."
