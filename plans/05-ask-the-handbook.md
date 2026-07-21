# Ask the Handbook — FCA Handbook AI chatbot

## Pitch
"Ask the Handbook" lets anyone type a plain-English question ("Does Consumer Duty apply to a prospective customer?") and get a grounded answer that quotes the exact FCA rule and links its provision code (e.g. PRIN 2A.1.5). It turns the dense, JS-heavy Handbook into a conversational, citation-first assistant — a compelling 2-hour vibe-coding demo built on scoped, verifiable public text.

## Data sources + verified status
- **handbook.fca.org.uk** — public, free, no login. **Angular/PrimeNG single-page app.**
- **Plain fetch/curl: FAILS.** Raw HTML is the app shell only (179 KB of JS/CSS, zero rule text). `ctx_fetch_and_index` returned nav chrome only. No working `sitemap.xml`, `.pdf`, or `.html` static export (all return HTTP 200, size 0). Undocumented backend API (`/api/*`, `remoteServiceBaseUrl` set at runtime) — not worth reverse-engineering live.
- **Playwright (headless) render: VERIFIED WORKS.** Legacy URL `…/handbook/PRIN/2A/1.html` 302-redirects to canonical route `…/handbook/prin2a/prin2as1`. After ~3s, `document.body.innerText` yields **8,776 chars of clean rule text with citation codes intact**: provision IDs (`PRIN 2A.1.3`), R/G markers (Rule vs Guidance), and effective dates. Exactly what's needed for citations.
- **Scope size (verified):** PRIN 2A (Consumer Duty) = **11 sections** (`prin2as1`–`prin2as11`), ~8 KB text each ≈ 20–25K tokens total. Add PRIN 1–4 (the 12 Principles, small) ≈ +15–20K tokens. **Whole scoped subset ≈ 40–50K tokens — fits in one Claude context. No vector DB needed (RAG-lite).**

## Scoping strategy (the pragmatic 2-hour play)
Do NOT attempt the whole Handbook (thousands of sections, undocumented API). Scope to a coherent, demo-friendly slice:
- **Tier 1 (must):** PRIN 2A — Consumer Duty (11 sections). Topical, current, board-level FCA priority.
- **Tier 2 (if time):** PRIN 1–4 (the Principles for Businesses).
- **Tier 3 (stretch):** one COBS chapter (e.g. COBS 2 — conduct) or SYSC 3 for breadth.
Scrape once → static markdown files committed to the repo. No live scraping at demo time (avoids latency/flakiness on stage).

## 2-hour build plan (Next.js + Vercel + Claude API)
1. **0:00–0:30 — Scrape (offline, once).** Node + Playwright script: iterate `prin2as1…s11` (+ PRIN chapters), `page.goto` → wait 3s → grab `innerText` of main content → write `data/prin2a-s{n}.md` with URL + provision codes preserved. Store `{code, text, url}` chunks in one `handbook.json`.
2. **0:30–1:00 — App scaffold.** `npx create-next-app`, one `/api/chat` route (Edge). Load `handbook.json` at build time.
3. **1:00–1:40 — RAG-lite answer route.** Stuff the full scoped corpus into the system prompt (fits in context). Call **`claude-fable-5`** (or `claude-sonnet-5` for speed/cost) via `@anthropic-ai/sdk`. System prompt: *"Answer ONLY from the provided Handbook extracts. Quote the rule and cite its provision code and URL. If not covered, say so."* Stream the response.
4. **1:40–2:00 — UI + deploy.** Minimal chat UI (input + streamed answer + clickable citation chips linking to `handbook.fca.org.uk/...`). `vercel deploy`. Rehearse 3 demo questions.

**Claude API notes:** single-shot context-stuffing (no embeddings/DB) since corpus < 50K tokens; enable prompt caching on the corpus block to cut cost/latency across turns; set `ANTHROPIC_API_KEY` in Vercel env. Model id `claude-fable-5`.

## Risks / fallbacks
- **Live scraping flaky on stage** → mitigate: scrape beforehand, commit static `handbook.json`; demo reads local data only.
- **Playwright on Vercel serverless is heavy** → keep scraping OFFLINE (build/dev only); runtime never launches a browser.
- **Hallucinated citations** → constrain model to provided text only; render citations from the stored `{code,url}`, never model-invented links.
- **Content drift / "as of" dates** → each chunk stores its effective date; show it. This is a demo, not regulated advice — add a visible disclaimer.
- **Total wipeout fallback** → pre-baked `handbook.json` (5–10 hand-saved sections) means the app works even if the site is down during the demo.

## Demo script
1. "Does the Consumer Duty apply to a prospective customer?" → quotes **PRIN 2A.1.5 (G)** verbatim + link.
2. "If Consumer Duty applies, do Principles 6 and 7 still apply?" → **PRIN 2A.1.3**: they do not.
3. "What counts as a 'product' under the Consumer Duty?" → **PRIN 2A.1.4**: includes products and services.
4. Ask something out-of-scope → assistant correctly says "not covered in the sections I have," proving it's grounded, not guessing.
