# 12 — "Fined, Then Folded": FCA Enforcement vs The Gazette Insolvency Notices

**Cross-data** — FCA fined firms/individuals JOINED with the official UK insolvency record
(The Gazette, the statutory publication of record). Answers: *of the people and firms the
FCA punished, who later went insolvent — leaving creditors and consumers exposed?*

## Pitch
A fine is the FCA's story ending. The Gazette is often the *real* ending: liquidation,
bankruptcy, administration. Joining them surfaces the firms and individuals that were
sanctioned by the regulator and then formally collapsed — the trail where redress money
evaporates. Verified on our data: of 12 sampled fined names, cleanly-matching individuals
lit up immediately — **Mark Bentley-Leek** (an FCA-sanctioned individual) → 7 insolvency
notices under his exact name; **Mustafa Dervish** → 5. This is the "the fine was just the
start" watchlist, sourced entirely from public records.

## Sources — exact URLs + verified status
| Source | URL | Key? | Verified |
|---|---|---|---|
| FCA fines | `data/fines.json` (300 rows: `firm, year, amount, reason, noticeUrl`) | no | YES |
| Gazette insolvency search (JSON) | `https://www.thegazette.co.uk/insolvency/notice/data.json?text={q}&results-page-size=N` | no | YES — 200 |
| Gazette all-notices search | `https://www.thegazette.co.uk/all-notices/notice/data.json?text={q}` | no | YES — 200 |
| Notice fields | `entry[].f:name`, `f:notice-code`, `title`, `published`, `link` | — | YES — confirmed |

No auth. Each notice exposes the entity name, notice code (insolvency type) and publish date.

## Verified caveat — read before building
The Gazette `text=` search is **full-text and fuzzy**, not exact-entity. It over-matches:
"Clydesdale Bank" returned 209 notices (matches "Bank" everywhere); "Alison Moran" matched an
unrelated "PLANTSCENT LIMITED" (a director named inside a notice). **Firm-name joins are noisy;
individual-name joins are clean.** So this idea must be built as a **pre-computed, confidence-
scored watchlist**, NOT live fuzzy search shown raw on stage — otherwise you risk claiming a
solvent firm "went bust" live. Treat it like Phoenix Watch (07): curate offline, present curated.

## 2-hour build plan
1. **(0:00-0:30) Build the join offline → cache.** Script: for each distinct fined name, query
   the Gazette insolvency endpoint. Score each candidate match: exact-name (individuals) = high;
   normalised firm-name token overlap + company-suffix match = medium; single common-word hit =
   discard. Write `data/gazette-matches.json` with `{fcaName, amount, reason, matchScore,
   notice:{name,code,published,link}}`. Ship only score>=medium.
2. **(0:30-0:50) Insolvency-type decode.** Map `f:notice-code` to human labels (creditors'
   voluntary liquidation, bankruptcy order, administration, etc.) via a small lookup.
3. **(0:50-1:30) Interactive visual.** A "Fined → Folded" timeline/table:
   - **Timeline** per matched entity: fine date ● → insolvency notice date ● with the £ fine
     amount and the days-between. Sort by shortest gap ("folded fastest after the fine").
   - **Filters:** insolvency type, individual vs firm, fine-size band, match confidence.
   - Row click → drawer with the FCA notice link + the Gazette notice link (both public sources).
4. **(1:30-1:55) Claude AI layer** (key in `.env.local`):
   - **Case briefing** — pass the matched pair (fine reason, amount, insolvency type, dates) to
     Claude for a 3-bullet "what likely happened to creditors/consumers" read, explicitly
     hedged ("public records suggest"), never asserting causation beyond the data.
   - **Watchlist chatbot** — Claude answers over `gazette-matches.json` ("which fined
     individuals later went bankrupt?", "shortest fine-to-collapse gap?"), grounded in the file.
5. **(1:55-2:00) Fallback wiring + dry-run.**

## Visual/tech
Static HTML + JS + inline SVG timeline; existing project server for `/api/brief`. Dark theme
per `design-spec.md`. Core view reads the cached JSON — zero live Gazette calls on stage.

## Risks + fallbacks
- **False positives (the big one).** Mitigated by the confidence score + curated cache + showing
  both source links so anyone can verify. Never present an unscored live match.
- **Causation overclaim.** The fine didn't necessarily cause the collapse. Copy and Claude prompt
  must say "sanctioned, then later insolvent" — correlation of public records, not cause.
- **Name collisions on common names.** Keep individuals with distinctive names; flag common ones
  as "low confidence — verify".
- **No-network fallback:** everything renders from `data/gazette-matches.json`; Claude degrades to
  a pre-written briefing string. Gazette is only hit during the offline pre-compute step.

## Demo script (2-3 min)
1. "An FCA fine is a headline. But what happened *next*? Let's check the UK's official insolvency
   record." Open the Fined→Folded timeline.
2. "Sorted by how fast they collapsed after the fine. Here's Mark Bentley-Leek — sanctioned by
   the FCA, and here in The Gazette: seven insolvency notices under his name." Click the row.
3. Claude briefing: reads the insolvency type + fine reason, explains in plain English what that
   likely meant for the people owed money — carefully hedged to the public record.
4. Filter to "bankruptcy" + "individuals": "The regulator's story ends at the fine. The Gazette
   shows where the money actually went." Close: "Two public registers, one accountability trail."
