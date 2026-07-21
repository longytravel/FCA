# 00 — Wildcard Playbook: "They picked something else"

**Use this when the FCA asks for something NOT on our 10-option list.** The goal: stay calm,
map their ask onto a **verified data source** + the **`starter/` kit**, and ship a working thing
in the 2-hour window. Never promise data we can't reach live.

---

## Step 1 — Triage (first 5 minutes, before touching code)

Ask them, in this order:

1. **What's the subject?** A firm? A person? Fines? Complaints? Scams? Rules? Market data?
2. **What data feeds it?** Do they have a specific dataset/URL in mind, or should we source it?
3. **Is the data public?** We only build on public/authorised data. If it's internal FCA data,
   politely reframe to the public equivalent (Register, Warning List, published fines, complaints
   workbooks, Handbook, RSS news).
4. **Insight or tool?** Do they want to *understand* data (briefing / dashboard / charts) or
   *do* something with it (search / checker / conversational lookup)? This picks the kit pieces.
5. **One killer moment?** What single on-stage demo would make them go "wow"? Build toward that.

Write their answers down. Everything below keys off them.

---

## Step 2 — Decision tree: map the ask onto sources + kit

### A. What data does it need?

| If they want… | Verified source | How we reach it |
|---|---|---|
| Firm authorisation / permissions / approved persons | **FCA Register API** (live) | `fetch-helpers.ts → fcaSearch / fcaGetFirm / fcaGetPermissions` |
| Company ownership, directors, filings, phoenixing | **Companies House API** (live) | `fetch-helpers.ts → chSearchCompanies / chGetOfficers / chGetPSC` |
| Unauthorised firms / scams / clone warnings | **FCA Warning List** | `data/warnings-latest.xml` + `data/warnings-sample.json` (pre-fetched) |
| Enforcement fines / penalties | **Published FCA fines** | `data/fines.json` (125 KB, ready) |
| Consumer complaints by firm/product | **FCA complaints data** | `data/complaints/` (workbooks) |
| Conduct rules / Principles / Handbook | **FCA Handbook** | `data/handbook-prin2a.json` (PRIN 2A ready; fetch more if needed) |
| Regulatory news / speeches / policy updates | **FCA RSS/news feed** | fetch live via a server route (see `03/06` plans) |
| Market data (rates, prices, FX) | **Public market API / ONS / BoE** | new `fetch` in a server route; cache to a fixture |

**If it's none of these:** can we get it as a public **CSV/JSON/API**? If yes → download once,
drop into `data/`, treat like any dataset below. If it's not public or not reachable in the
window → reframe to the closest source above and say so honestly.

### B. Insight or tool? → which kit pieces

- **"Help me understand this data"** →
  `insight.ts` (executive briefing) + `charts.tsx` (StatCards + LeagueTable + TimeSeries) +
  optionally `ChatPanel` over the dataset. This is a **dashboard**. Fastest path to a wow.
- **"Let me look something up / check something"** →
  `fetch-helpers.ts` (live source) + a search page + `ChatPanel` with the fetchers as context.
  This is a **tool**. Best when they name a specific firm/company.
- **"Ask questions in plain English"** →
  `chat-route.ts` + `ChatPanel.tsx`, `contextDocs` = the dataset (or live-fetched JSON).
  Grounded, cites figures, refuses to invent. Works over ANY of the sources above.
- **"Both"** → dashboard with an embedded chat panel. Default to this if unsure — it demos well.

### C. Reframe scripts (keep it honest, keep momentum)

- *Internal/private data:* "We build only on public data — the public-facing version of that is
  the **[Register / Warning List / published fines]**, and we can have it live in an hour."
- *Data we can't source in time:* "We can prototype the experience now on **[nearest source]** and
  swap your dataset in — the plumbing is identical."
- *Something huge:* scope to the **one killer moment** from triage; build that end-to-end, stub the rest.

---

## Step 3 — Generic 2-hour timeline

Assumes `.env.local` already has `ANTHROPIC_API_KEY`, `FCA_API_EMAIL`, `FCA_API_KEY`,
`COMPANIES_HOUSE_API_KEY` (it does). Kit lives in `starter/`.

### 0:00–0:15 — Scaffold
- Confirm the killer moment out loud with the room. Lock scope to it.
- New route/page in the existing app (reuse `SiteNav`/`GlowField`/tokens for instant polish).
- `npm i @anthropic-ai/sdk recharts` (only what this build needs).
- Copy the relevant kit files out of `starter/` into `app/` / `src/`.

### 0:15–1:00 — Data
- Wire the data path first — **prove the data is real before building UI on top of it.**
  - Live source → copy `fetch-helpers.ts`, hit one endpoint from a route, log the JSON.
  - Static dataset → import from `data/`, shape it (map/filter/aggregate) into chart-ready rows.
- Immediately cache a **fallback fixture** (a few records to JSON) so a live hiccup never stalls the demo.
- Get *something* rendering: a raw list or one `StatCard`. Data on screen = de-risked.

### 1:00–1:30 — Wow layer
- Add the piece that makes them lean in:
  - `LeagueTable` + `TimeSeriesChart` + `StatGrid` for a dashboard, **or**
  - `ChatPanel` grounded on the data for conversational Q&A, **or**
  - `insight.ts` to auto-write the executive briefing on the page.
- Keep the system prompt tight: answer only from context, cite figures, refuse if unknown.

### 1:30–1:55 — Polish
- Loading/empty/error states; a "showing cached data" banner behind the fallback.
- Layout on the dark/teal tokens; headline + one-line "what this is" + data-source footnote.
- 2–3 pre-seeded `starterQuestions` that you KNOW produce a great answer. Rehearse them.

### 1:55–2:00 — Deploy + dry run
- `npm run build` locally, then push to Vercel (env vars set in the project already).
- Run the killer moment once, live, end to end. Have the local build as a backup if Vercel lags.

---

## Golden rules (why we don't crash on stage)

1. **Prove the data early.** Nothing else matters if the source is dead. Data on screen by 1:00.
2. **Always cache a fixture.** Every live source gets a JSON fallback + a visible banner.
3. **Ground the model.** Real data via `contextDocs`; prompt forbids invention. Non-negotiable
   for a regulator audience.
4. **Keys stay server-side.** `fetch-helpers.ts` / `insight.ts` never touch a client component.
5. **Scope to one moment.** A single flawless demo beats three half-built ones.
6. **Reuse the shell.** The existing site's nav, glow background and tokens make anything look
   finished in minutes — build inside it, not from scratch.
