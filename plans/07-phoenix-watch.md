# 07 — Phoenix Watch (FCA enforcement × Companies House)

## Pitch
The FCA fines or blacklists a firm, but its directors quietly resurface running brand-new
companies. Phoenix Watch cross-references FCA fined/Warning-List firms against Companies House
officer records to expose directors whose old firm was shut down while they already control
freshly incorporated ones — the "phoenix" pattern regulators hate. Live on stage: type a fined
firm, watch its directors light up a network graph of their *other* active companies.

## Data sources
| Source | URL | Access | Verified |
|--------|-----|--------|----------|
| FCA fines table 2013–25 | https://www.fca.org.uk/news/news-stories/... (already scraped by team) | HTML tables | YES (team) |
| FCA Warning List RSS/~18k | https://www.fca.org.uk/news/rss.xml + warnings feed | RSS/XML | YES (team) |
| Companies House REST API | https://api.company-information.service.gov.uk | **Free API key** (basic auth, key as username). Instant self-service signup at developer.company-information.service.gov.uk. Endpoints: `/search/companies?q=`, `/company/{num}`, `/company/{num}/officers`, `/officers/{id}/appointments` | YES — 401 without key confirms live; signup instant |
| CH advanced-search (fallback, NO key) | https://find-and-update.company-information.service.gov.uk/advanced-search/get-results?companyNameIncludes=…&companyStatus=dissolved | HTML scrape, no key | YES (HTTP 200) |

**Get the key BEFORE the demo** (5-min signup). Fallback if key fails: scrape the no-key
advanced-search HTML for company status/number, skip officer graph.

## 2-hour build (Next.js + Vercel)
1. **0:00–0:20** `create-next-app`, deploy skeleton to Vercel. Add `CH_API_KEY` env var.
   Server route `/api/ch` proxies CH API (basic auth `Buffer.from(key+':').toString('base64')`).
2. **0:20–0:50** Seed list: load ~30 notable FCA fined firms + a few Warning-List names into a
   local JSON (pre-baked so demo is fast/reliable). For each: `search/companies` → best match →
   `/company/{num}/officers` → collect officer IDs + `resigned_on`/company status.
3. **0:50–1:20** For each officer: `/officers/{id}/appointments` → list their OTHER companies,
   flag any `active` or `incorporated_on` AFTER the fined firm's dissolution/fine date = phoenix
   score. Cache all responses to `/public/cache.json` so the live demo needs zero network.
4. **1:20–1:50** UI: searchable firm list → click → force-directed graph (react-force-graph or
   vis-network via CDN-inlined) of firm→directors→other companies. Red nodes = active co's post-fine.
5. **1:50–2:00** Deploy, smoke-test 3 known juicy examples, write demo patter.

## Risks / fallbacks
- **API key friction** — get it beforehand; pre-cache all API responses into `cache.json` so the
  live app reads from disk (demo cannot fail on network/rate-limit). CH rate limit: 600 req/5min.
- **Name-matching noise** — FCA firm names ≠ CH legal names; use `search/companies` top hit + show
  confidence, hand-pick the 30 seed firms so matches are clean.
- **Warning-List firms often unregistered** (clone scams) — that's a *feature*: "not even a real
  company" is a strong on-stage line. Lead the demo with genuine fined firms that DO resolve.

## Demo script (90 sec)
"The FCA fined [Firm X] £Ym in 2019 and it dissolved. So that's over, right?" → search it →
graph blooms → "Its finance director? Still running these three companies incorporated in 2021.
We built this in two hours by joining two free public datasets nobody joins." Zoom a red node.
