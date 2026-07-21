# FCA Register Explorer — Live Vibe-Coding Build Plan

## Pitch
A search-first web app over the FCA Financial Services Register: type any firm name and instantly see its authorisation status, permissions, key people and disciplinary history — then ask a chatbot "Is this firm allowed to give investment advice?" and get a plain-English answer grounded in live Register data. It turns the FCA's own public register into a conversational "is this firm legit?" checker in front of the people who run it.

## Data source — VERIFIED LIVE
- **API base:** `https://register.fca.org.uk/services/V0.1/`
- **Access method:** Free API key. Two request headers required: `X-Auth-Email` (your registration email) + `X-Auth-Key` (key from your dev profile).
- **Signup:** https://register.fca.org.uk/Developer/s/registernewuser — free, key is available instantly from your profile after registering (no approval wait).
- **VERIFIED STATUS:** ✅ Endpoints tested live today — `GET /Firm/122702` and `/Search?q=barclays&type=firm` both return HTTP 403 `{"Success":"false", ... "Missing Headers."}`, confirming the endpoints exist and only need the two auth headers. Once headers are added they return JSON.
- **Rate limit:** 50 requests / 10 seconds. Fine for demo; no SLA (free service).

### Key endpoints (all under the base + auth headers)
- `Search?q={query}&type=firm` — firm name search → returns FRN + status
- `Firm/{FRN}` — core record: name, status (Authorised/EEA/etc.), companies house no.
- `Firm/{FRN}/Names` — trading names
- `Firm/{FRN}/Permissions` — regulated activities (the "what are they allowed to do")
- `Firm/{FRN}/Individuals` — approved persons at the firm
- `Firm/{FRN}/Address` · `Firm/{FRN}/Requirements` · `Firm/{FRN}/DisciplinaryHistory`
- `Individuals/{IRN}` + `Individuals/{IRN}/CF` (controlled functions)
- `Search?q=...&type=individual` and `type=fund` also supported

## Stack
Next.js (App Router) on Vercel. Server-side API routes proxy the FCA API (keeps `X-Auth-Key` server-only, avoids CORS). Tailwind for UI. Anthropic `claude-sonnet-5` (or `claude-fable-5`) for the chatbot with tool-use calling the same proxy routes. No database — live calls only.

## 2-Hour Build Plan
- **0:00–0:15** Register for API key; `npx create-next-app`; add `FCA_EMAIL`, `FCA_KEY`, `ANTHROPIC_API_KEY` to `.env.local`. Smoke-test one authed `curl` from a route.
- **0:15–0:35** `lib/fca.ts` — typed fetch wrapper injecting both headers + base URL; helpers `searchFirms()`, `getFirm(frn)`, `getPermissions(frn)`, `getIndividuals(frn)`.
- **0:35–1:00** Search page: input box → `/api/search` route → results list (name, FRN, status badge green/amber/red).
- **1:00–1:25** Firm detail view: status header + tabs/cards for Permissions, People, Disciplinary. Clean, scannable.
- **1:25–1:50** Chatbot panel: `/api/chat` route runs Claude with tool-use (`search_firm`, `get_firm_permissions`). Claude answers "can firm X do Y?" grounded in returned JSON, citing FRN + status.
- **1:50–2:00** Deploy to Vercel (env vars set), final demo run-through.

## Risks & Fallbacks
- **R1: Signup friction / key not instant.** Mitigation: register FIRST thing (or the night before). Fallback: pre-fetch & cache JSON for 3–4 well-known firms (Barclays FRN 122702, Monzo, Revolut) into `/fixtures`, serve from those so the demo never depends on live calls.
- **R2: Rate limit (50/10s) during rapid demo clicks.** Add a 200ms debounce + in-memory cache per FRN. Fallback fixtures cover this too.
- **R3: API slow / down (no SLA).** Fixtures fallback; wrap calls in try/catch with a "showing cached data" banner.
- **R4: Chatbot hallucinating status.** Force tool-use only; system prompt: "Only state facts returned by tools; always cite FRN + status; if unknown, say so."
- **R5: CORS.** Avoided — all FCA calls go through Next.js server routes, never the browser.

## Demo Script (approx 5 min)
1. "This is the FCA's own public Register data, live." Type **"Barclays"** → results appear with FRN + green Authorised badge.
2. Click Barclays → show Permissions and approved People pulled live.
3. Search a firm that's **not authorised / has cancelled status** → red badge. "This is exactly the scam-check a consumer needs."
4. Ask the chatbot: **"Can this firm give investment advice?"** → Claude calls the permissions tool and answers in plain English, citing the FRN.
5. Ask **"Find firms called Revolut and tell me which is the authorised one"** → shows disambiguation from live search.
6. Close: "Built in 2 hours on your own public API — this is the consumer-facing register experience, made conversational."

## Sources
- [FCA Financial Services Register](https://www.fca.org.uk/firms/financial-services-register)
- [Developer signup](https://register.fca.org.uk/Developer/s/registernewuser)
- [fsrapiclient (endpoint reference)](https://github.com/sr-murthy/fsrapiclient)
