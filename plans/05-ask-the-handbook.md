# Ask the Handbook — FCA Handbook AI chatbot
`AUDIT: verified 2026-07-21, by audit-1`

## Pitch
"Ask the Handbook" lets anyone type a plain-English question ("Does Consumer Duty apply to a prospective
customer?") and get a grounded answer that **quotes the exact FCA rule and cites its provision code**
(e.g. PRIN 2A.1.5) with a link. It turns the dense, JS-heavy Handbook into a citation-first assistant — a
compelling 2-hour demo built on scoped, verifiable public text. Hits two wow layers: (a) a Claude chatbot and
(b) AI answer text that is always grounded and cited.

## Data source — VERIFIED & HARVESTED (2026-07-21)
- **handbook.fca.org.uk** is an Angular SPA — plain `fetch`/`curl` returns the app shell only (no rule text).
  Live scraping needs Playwright (headless render). **We already did this offline.**
- **Pre-harvested & ready — `data/handbook-prin2a.json` (confirmed):**
  - **72 chunks**, fields `section, ref, type, text`. `type` = R (Rule) / G (Guidance); `ref` = provision code
    (e.g. `PRIN 2A.1.3`). Clean rule text, citation codes intact.
  - **~33.3K chars ≈ 8.3K tokens total** — the *entire* scoped corpus fits in one Claude context with huge
    headroom. **No vector DB, no embeddings — pure context-stuffing (RAG-lite).**
  - ⚠ Note: fewer tokens than the plan's old 40–50K estimate — this is *better* (cheaper, faster, easier),
    but it means the current corpus is **PRIN 2A only**. If broader breadth is wanted, harvest PRIN 1–4 the
    same way before the demo; otherwise scope the demo to Consumer Duty (still a complete, board-level story).

## Scoping strategy
Do NOT attempt the whole Handbook. Ship the harvested **PRIN 2A — Consumer Duty** slice (72 chunks). It's
topical, current, and a board-level FCA priority. Stretch (only if pre-harvested): PRIN 1–4, or one COBS
chapter. No live scraping at demo time.

## Stack
Existing Next.js 15 scaffold (reuse — no `create-next-app`). One `/api/chat` route. `@anthropic-ai/sdk`,
model `claude-fable-5`. **Missing dep — install first:** `npm i @anthropic-ai/sdk`. Playwright is NOT a
runtime dependency — harvesting is already done and committed.

## 2-hour build plan
- **0:00–0:15 — Setup.** Reuse scaffold; `npm i @anthropic-ai/sdk`; add `ANTHROPIC_API_KEY`. Copy
  `data/handbook-prin2a.json` → app data dir; confirm it loads (72 chunks).
- **0:15–0:45 — Answer route (the spine).** `/api/chat` (Edge or Node). Stuff the full 72-chunk corpus into
  the system prompt (it fits). System prompt: *"Answer ONLY from the provided Handbook extracts. Quote the
  rule verbatim and cite its provision code (`ref`) and link. If not covered, say so — do not guess."*
  **Stream** the response. Enable **prompt caching** on the corpus block to cut latency/cost across turns.
- **0:45–1:20 — WOW (a)+(b) chat UI.** Input + streamed answer + **citation chips** rendered from the stored
  `{ref, section}` (never model-invented) that link to `handbook.fca.org.uk/...`. Show each chunk's R/G marker.
- **1:20–1:45 — Grounding polish + visual touch (c-lite).** A small sidebar listing the 11 PRIN 2A sections
  as clickable "jump" chips (gives a visual map of scope + doubles as suggested prompts). Highlight the cited
  section when an answer lands. Add a visible "demo, not regulated advice" disclaimer.
- **1:45–2:00 — Deploy + rehearse** the 4 demo questions below. `vercel deploy`.

## Risks / fallbacks
- **Claude API fails live** → pre-bake answers for the 4 demo questions as static JSON; UI serves those if
  `/api/chat` errors, so the demo always shows a grounded, cited answer.
- **Corpus is PRIN 2A only** → frame the demo as Consumer Duty; out-of-scope questions *should* return "not
  covered" — that's a feature (proves grounding). Only broaden if PRIN 1–4 is harvested beforehand.
- **Hallucinated citations** → constrain to provided text; render citation chips from stored `ref`/`url` only.
- **Content drift / "as of"** → each chunk carries its section ref; show it. Demo, not advice — disclaimer visible.
- **Playwright on Vercel** → not a factor; harvesting is offline and already committed.

## Demo script
1. "Does the Consumer Duty apply to a prospective customer?" → quotes the relevant PRIN 2A rule + link.
2. "If Consumer Duty applies, do Principles 6 and 7 still apply?" → cites the disapplication provision.
3. "What counts as a 'product' under the Consumer Duty?" → quotes the definition, cited.
4. Ask something out-of-scope → "not covered in the sections I have" — proving it's grounded, not guessing.
