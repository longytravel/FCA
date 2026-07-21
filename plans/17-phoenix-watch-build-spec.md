# 17 — Phoenix Watch build spec (CHOSEN BUILD — full FCA restyle + live app)

Single source of truth for the multi-agent build. Read fully before writing code.
Plan `plans/07-phoenix-watch.md` has the pitch + data background; THIS file wins on conflicts.

## Mission

Same Next.js 15 app (App Router, Tailwind 4, TS). Two workstreams:
1. **Restyle the whole site to look exactly like fca.org.uk** (user has FCA's blessing, logos included).
2. **Build Phoenix Watch at `/phoenix-watch`** — live Companies House data, interactive force graph,
   transparent risk scoring, streamed Claude briefings, agentic chatbot, sweep league table,
   timeline replay, case dossiers, presenter mode. Everything live — no mocks, no canned responses.
   The pre-baked fixture is only the *instant first paint*; every interaction hits real APIs.

## FCA design system (extracted from live fca.org.uk CSS on 2026-07-21)

- Brand: mulberry `#6c1d45` (primary — nav bar, headings, buttons), navy `#003c71`,
  teal `#00bfb3`, yellow `#ffc72c`, coral red `#ff585d`, mid-blue `#007fae`, dark teal `#004851`.
- Neutrals: panel grey `#f0f0f1`, body text `#3f3f3f`, rules `#d2d2d4`, muted `#75767a`, white cards.
- Type: **Arial, sans-serif** body (that flat institutional look IS the brand), Verdana fallback stack
  for some elements. No serif anywhere. Bold weight for headings, sentence case.
- Components: flat rectangles, 0–2px radius, 1px `#d2d2d4` borders, mulberry links (underlined on hover),
  square flat buttons (mulberry bg / white text; secondary: white bg / mulberry border+text).
- Header pattern: white top bar with FCA logo (`/fca/logo.png`, already in `public/fca/`) left +
  search box right; below it a **mulberry nav strip** with white uppercase-ish links; breadcrumb bar
  (grey, `Home > Section > Page`) on subpages.
- Footer: mulberry background, white link columns, small print row.
- Keep one small footer line: "A live vibe-coding demonstration built with the FCA — not the official fca.org.uk."

## File ownership (HARD boundaries — do not edit outside your set)

| Agent | Owns |
|---|---|
| A restyle | `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `app/method/**`, `app/how-it-works/**`, `src/components/ui.tsx`, `src/components/MobileNavMenu.tsx` |
| B phoenix-ui | `app/phoenix-watch/**` (page, components, presenter mode, dossier view, chat panel UI), `src/components/phoenix/**` |
| C data-api | `app/api/ch/**`, `app/api/phoenix/**`, `src/lib/phoenix/**` (ch.ts, risk.ts, types.ts, graph.ts), `scripts/sweep.mjs` |
| D ai | `app/api/ai/**` (chat, insight, dossier routes) |

Deps already installed: `@anthropic-ai/sdk@^0.112.4`, `react-force-graph-2d`, `recharts`. Do NOT add packages.

## Data contracts

### Graph (matches `data/fixtures/phoenix-graph.json`, extended)
```ts
// src/lib/phoenix/types.ts  (owner: C — everyone imports from here)
export type PNode = {
  id: string;                       // company number | officer id
  type: "company" | "officer";
  name: string;
  status?: string;                  // active | dissolved | liquidation ...
  incorporated_on?: string; dissolved_on?: string;
  tags: string[];                   // phoenix-seed | fined-seed | linked
  address?: string; sic_codes?: string[];
  risk?: number;                    // 0-100, officers only
  riskFactors?: RiskFactor[];
};
export type PEdge = { source: string; target: string; role: string;
  appointed_on?: string; resigned_on?: string };
export type PhoenixGraph = { nodes: PNode[]; edges: PEdge[] };
export type RiskFactor = { key: "gap"|"same_address"|"same_sic"|"co_director"|"active_count";
  label: string; points: number; detail: string };
```

### `src/lib/phoenix/ch.ts` (owner: C; D imports these — signatures are FROZEN)
```ts
export async function chGet(path: string): Promise<any>;            // basic-auth proxy, COMPANIES_HOUSE_API_KEY
export async function searchCompanies(q: string, limit?: number): Promise<any[]>;
export async function getCompanyProfile(num: string): Promise<any>;
export async function getOfficers(num: string): Promise<any[]>;
export async function getAppointments(officerId: string): Promise<any[]>;
export async function resolvePhoenixGraph(companyNumber: string): Promise<PhoenixGraph>; // full chain + risk scores
```
CH API: `https://api.company-information.service.gov.uk`, basic auth (key as user, empty pw),
600 req/5min — throttle politely, cache in-memory per server instance.

### Risk score (owner: C, `risk.ts`) — transparent, per officer
gap between old-firm dissolution/fine and new incorporation (≤2y: up to 30pts) · same registered
address old vs new (25) · same SIC (15) · co-director overlap (15) · count of active linked
companies (up to 15). Return score + the RiskFactor breakdown; UI shows the working.

### Fines: `data/fines.json` — 300 rows `{year, firm, date "DD/MM/YYYY", amount, reason, noticeUrl, isCourtFine}`

### Sweep: `scripts/sweep.mjs` (owner: C) — node script, reads `.env.local`, runs the chain over
all 300 fined firms (throttled), writes `data/fixtures/sweep-results.json`:
`{ generatedAt, results: [{ firm, fineDate, amount, companyNumber, matchedName, directors: [{ name, officerId, risk, riskFactors, activeCompanies: [{number,name,incorporated_on,status}] }] }] }`
`GET /api/phoenix/sweep` serves that file. Orchestrator runs the script; write it resumable
(skip firms already in the output file).

## API routes

| Route | Owner | Contract |
|---|---|---|
| `GET /api/ch/search?q=` | C | live CH typeahead, `{items:[{title, company_number, company_status, date_of_creation, address_snippet}]}` |
| `GET /api/phoenix/resolve?company=NUM` | C | `{graph: PhoenixGraph, meta:{firm, resolvedAt}}` — live chain |
| `GET /api/phoenix/sweep` | C | cached sweep-results.json (404 w/ helpful message if not yet generated) |
| `POST /api/ai/insight` | D | body `{graph, focusId}` → **streamed text** risk briefing (3–6 sentences, cites names+dates) |
| `POST /api/ai/dossier` | D | body `{graph, focusId, fines}` → **streamed markdown** supervisory dossier (exec summary, entities table, chronology, recommended action) |
| `POST /api/ai/chat` | D | body `{messages:[{role,content}], graph}` → **NDJSON stream** (below). Agentic: manual tool loop with tools `search_companies`, `get_officers`, `get_appointments` (implement via `src/lib/phoenix/ch.ts`). When tools return new entities, ALSO emit a `graph` event so the UI grows the graph live. |

### Chat NDJSON stream protocol (one JSON object per line)
```
{"type":"text","delta":"..."}                       // assistant text chunk
{"type":"tool","name":"get_officers","label":"Looking up officers of X"}   // status chip
{"type":"graph","nodes":[PNode...],"edges":[PEdge...]}                    // merge into graph
{"type":"done"}
```

## Claude API rules (owner D — from the claude-api skill, current as of 2026-07)
- Model: **`claude-opus-4-8`** everywhere. TS SDK `@anthropic-ai/sdk` (installed). Key: `ANTHROPIC_API_KEY` (in `.env.local`; must also be set in Vercel env).
- Always **stream** (`client.messages.stream(...)`); NO `temperature/top_p/top_k` (400s); NO assistant prefill (400s); thinking: omit or `{type:"adaptive"}`; system prompt grounds the model in the graph JSON + tells it to cite company numbers and dates and to say "not in the data" rather than invent.
- Chat: manual streaming tool loop (stream → collect tool_use blocks → run → push tool_result → loop). Cap 6 iterations.

## Phoenix Watch UI (owner B) — one page, sections in order
1. **Hero strip** (FCA style): title, one-line pitch, live firm search (typeahead via `/api/ch/search`, debounced), three case chips (Blackmore Bond `10273135`, London Capital & Finance `08140312`, Basset & Gold `05433451`).
2. **Graph stage**: `react-force-graph-2d` via `next/dynamic` `ssr:false`. Fixture graph (`fetch('/phoenix-graph.json')` — C copies fixture to `public/`) renders instantly; selecting a search result calls `/api/phoenix/resolve` and merges. Companies = squares-ish nodes mulberry/grey; phoenix-signal (active linked, incorporated near/after fine) = coral `#ff585d`; officers = navy circles sized by risk. Click node → side panel (real CH fields, risk breakdown bars, "Generate dossier" button). **Timeline replay**: scrubber + play button filtering nodes/edges by date (incorporated_on/appointed_on vs slider date), fine dates marked.
3. **AI briefing panel**: on firm select, POST `/api/ai/insight`, stream text in.
4. **Chat dock** "Ask this network": streams NDJSON, renders text + tool chips, merges `graph` events into the live graph.
5. **Sweep league table**: from `/api/phoenix/sweep` — sortable table of resurfaced directors (firm, fine £, director, risk score, active companies), row click loads that firm into the graph. Recharts mini-bar of fines by year optional.
6. **Dossier**: modal/route rendering streamed markdown from `/api/ai/dossier`, print stylesheet.
7. **Presenter mode**: `?present=1` or button — hides site chrome, big graph, keyboard 1/2/3 jump to the three cases, `Esc` exits.
Styling: FCA tokens above, Arial, flat panels, mulberry accents. Loading/error states everywhere (real APIs fail sometimes — show honest errors, never fake data).

## Site integration (owner A)
- Nav: add **Phoenix Watch** link (highlighted). Card 07 on the board: add "★ Being built live today" ribbon linking `/phoenix-watch`.
- Keep all 16 cards + method/how-it-works pages, restyled to FCA look. Serif fonts removed (layout.tsx: drop Newsreader, keep system Arial). Existing class names in pages you own may be rewritten freely.

## Quality bar
- `npx tsc --noEmit` clean and `npm run build` clean at integration (cross-agent imports resolve then).
- No `any` leaking into exported signatures beyond the CH passthroughs typed above.
- Never expose API keys client-side; all external calls server-side.
