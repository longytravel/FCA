# FCA Register Explorer — Live Vibe-Coding Build Plan
`AUDIT: verified 2026-07-21, by audit-1`

## Pitch
Search the FCA Financial Services Register live: type any firm name and instantly see
authorisation status, permissions, and key people — then let Claude auto-write a plain-English
**"Firm Briefing"** and answer "Is this firm allowed to give investment advice?" grounded in the
live JSON it just pulled. The FCA's own register, made conversational, in front of the people who run it.

## Data source — VERIFIED LIVE & KEYED (2026-07-21)
- **API base:** `https://register.fca.org.uk/services/V0.1/`
- **Auth:** two headers — `X-Auth-Email` + `X-Auth-Key`. **The working key is already in `.env.local`**
  as `FCA_API_EMAIL` / `FCA_API_KEY` (bonus `COMPANIES_HOUSE_API_KEY` also present). **No signup needed** —
  this removes plan risk R1 entirely.
- **RE-TESTED LIVE TODAY, all HTTP 200 JSON:**
  - `GET /Firm/122702` → 200, "Ok. Firm Found" (Barclays)
  - `GET /Search?q=barclays&type=firm` → 200, total_count 103 (disambiguation works)
  - `GET /Firm/122702/Permissions` → 200, 42 permissions (paginated 20/page, `Next` link)
  - `GET /Firm/122702/Individuals` → 200 (⚠ total_count is large/historical — paginated; do NOT enumerate all)
- **Rate limit:** 50 req / 10s. Fine for demo.

### Key endpoints (base + auth headers)
- `Search?q={query}&type=firm|individual|fund` — name search → FRN + status
- `Firm/{FRN}` · `Firm/{FRN}/Names` · `Firm/{FRN}/Permissions` · `Firm/{FRN}/Individuals`
- `Firm/{FRN}/Address` · `Firm/{FRN}/DisciplinaryHistory`
- All responses wrap payload in `Data[]` with a `Status`/`Message` envelope — unwrap `Data`.

## Stack
Existing Next.js 15 App Router scaffold (already present — reuse `app/`, do NOT `create-next-app`).
Server API routes proxy the FCA API (keeps key server-only, avoids CORS). Tailwind (installed).
Chatbot + briefing via `@anthropic-ai/sdk`, model `claude-fable-5`. No DB — live calls, in-memory cache.
**Missing deps — install first:** `npm i @anthropic-ai/sdk` (recharts optional for a permissions viz).

## 2-Hour Build Plan
- **0:00–0:10 — Setup.** Confirm `.env.local` keys load; `npm i @anthropic-ai/sdk`; add `ANTHROPIC_API_KEY`.
  Smoke-test one authed fetch from a route handler (Barclays 122702) — must return 200 before building.
- **0:10–0:30 — `lib/fca.ts`.** Typed fetch wrapper injecting both headers + base; unwraps `Data`.
  Helpers: `searchFirms()`, `getFirm()`, `getPermissions()`, `getIndividuals()`. In-memory `Map` cache by FRN.
- **0:30–0:55 — Search + firm detail.** `/api/search` route → results list (name, FRN, status badge
  green Authorised / amber / red Cancelled). Click → detail: status header + Permissions and People cards.
- **0:55–1:20 — WOW (b) AI Firm Briefing.** `/api/briefing` route: feed the firm's live JSON (status +
  permissions + people count) to Claude → 3-sentence plain-English briefing ("Barclays is authorised, holds
  42 permissions including accepting deposits and advising on investments…"). Render at top of detail card,
  streamed. **This is the headline wow** — insight text nobody has seen over this data.
- **1:20–1:45 — WOW (a) Chatbot with tool-use.** `/api/chat` runs Claude with tools `search_firm`,
  `get_firm_permissions`. Answers "can firm X do Y?" citing FRN + status. Force tool-use; no free-form facts.
- **1:45–2:00 — Deploy to Vercel** (env vars set), rehearse the 3 demo beats below.

## Risks & Fallbacks
- **R1 (signup) — ELIMINATED:** key already works.
- **R2 Rate limit on rapid clicks:** 200ms debounce + per-FRN cache. Pre-cache 3 firms (Barclays 122702,
  and two from a live search) into `fixtures/` as a hard fallback.
- **R3 API slow/down (no SLA):** wrap calls in try/catch → serve fixtures with a "cached" banner.
- **R4 Claude API fails live:** briefing + chat degrade to a **pre-generated static briefing** for the 3
  demo firms (bake JSON at build). App still fully works showing live register data without AI.
- **R5 Chatbot hallucination:** tool-use only; system prompt "state only tool-returned facts, always cite
  FRN + status, say 'unknown' otherwise." Render citations from stored JSON, never model-invented.
- **R6 Individuals huge count:** page 1 only (20); show "18k+ approved persons on record", never enumerate.

## Demo Script (~5 min)
1. "This is the FCA's own live Register." Type **Barclays** → FRN + green Authorised badge.
2. Click through → **Claude's Firm Briefing writes itself** at the top; scroll Permissions + People.
3. Search a **cancelled/unauthorised** firm → red badge. "Exactly the scam-check a consumer needs."
4. Ask the chatbot **"Can this firm give investment advice?"** → tool-use answer citing the FRN.
5. **"Find firms called Revolut and tell me which is authorised"** → live disambiguation.
6. Close: "Built in 2 hours on your own public API — the register, made conversational."

## Sources
- [FCA Financial Services Register](https://www.fca.org.uk/firms/financial-services-register)
- [fsrapiclient (endpoint reference)](https://github.com/sr-murthy/fsrapiclient)
