# Wildcard Starter Kit — wire it in under 10 minutes

Reusable, on-brand building blocks for a live Next.js (App Router) build. These files are
**templates** — they live in `starter/` and are **excluded from the app build** (see the
`exclude` in `tsconfig.json`), so `npm run build` stays green until you deliberately copy one
into `app/`. They deliberately reference `@anthropic-ai/sdk` and `recharts`, which you install
only when you use them.

| File | What it is | Copy to |
|------|-----------|---------|
| `chat-route.ts` | Streaming Claude chat API route | `app/api/chat/route.ts` |
| `ChatPanel.tsx` | Client chat UI (pairs with the route) | `src/components/ChatPanel.tsx` |
| `insight.ts` | JSON dataset → executive briefing (server) | `src/lib/insight.ts` |
| `charts.tsx` | Recharts wrappers: time series, league table, stat cards | `src/components/charts.tsx` |
| `fetch-helpers.ts` | FCA Register + Companies House fetchers (server) | `src/lib/fetch-helpers.ts` |

## 0. One-time env (`.env.local`)

Already present in this repo:

```
ANTHROPIC_API_KEY=...          # add this one for chat/insight
FCA_API_EMAIL=...              # FCA Register API
FCA_API_KEY=...
COMPANIES_HOUSE_API_KEY=...
```

## 1. Add a Claude chatbot over any data (~4 min)

```bash
npm i @anthropic-ai/sdk
```

1. Copy `chat-route.ts` → `app/api/chat/route.ts`.
2. Copy `ChatPanel.tsx` → `src/components/ChatPanel.tsx`.
3. Drop the panel into a page, passing your data as `contextDocs`:

```tsx
import ChatPanel from "@/src/components/ChatPanel";
import fines from "@/data/fines.json";

<ChatPanel
  title="Ask the enforcement data"
  system="You are an FCA enforcement analyst. Answer only from the context."
  contextDocs={JSON.stringify(fines)}
  starterQuestions={["Biggest fine in 2024?", "Which failing appears most often?"]}
/>
```

The route streams tokens; the panel renders them live. Model defaults to `claude-fable-5`
(swap to `claude-sonnet-5` in `chat-route.ts` for speed/cost).

## 2. Generate an executive briefing (~2 min)

```ts
// e.g. app/api/insight/route.ts
import { generateInsight } from "@/src/lib/insight";
import fines from "@/data/fines.json";

export async function GET() {
  const briefing = await generateInsight(fines, {
    audience: "FCA supervision leadership",
    question: "What enforcement themes are emerging?",
  });
  return Response.json({ briefing });
}
```

Returns a structured markdown briefing (Headline / Key findings / What stands out / Next question).

## 3. Add charts (~2 min)

```bash
npm i recharts
```

```tsx
import { TimeSeriesChart, LeagueTable, StatCard, StatGrid } from "@/src/components/charts";

<StatGrid>
  <StatCard label="Total fines" value="£1.2bn" hint="2024" />
  <StatCard label="Cases" value={42} trend={{ direction: "up", value: "+12%" }} />
</StatGrid>

<LeagueTable data={rows} labelKey="firm" valueKey="amount" title="Largest fines" topN={10}
  valueFormatter={(v) => `£${(v / 1e6).toFixed(1)}m`} />

<TimeSeriesChart data={monthly} xKey="month" yKey="total" title="Fines over time" />
```

## 4. Pull live public data (~2 min)

```ts
import { fcaSearch, fcaGetPermissions, chSearchCompanies } from "@/src/lib/fetch-helpers";

const results = await fcaSearch("Barclays");          // FCA Register
const perms  = await fcaGetPermissions(122702);        // regulated activities
const co      = await chSearchCompanies("Monzo");       // Companies House
```

All fetchers are **server-only** (they read secret keys), cache for 5 min to respect the FCA
rate limit (50 req / 10s), and throw on non-2xx so you can `try/catch` with a fallback banner.

## Design tokens

Components use the site's Tailwind tokens (`ink`, `ink-2`, `teal`, `teal-bright`, `line`,
`text`, `text-soft`, `muted`, `muted-dark`). Dropping into a bare `create-next-app`? Either
port the tokens from `app/globals.css` or swap for `slate-*` / `zinc-*` equivalents.

## Guardrails for the demo

- **Ground the model.** Always pass real data via `contextDocs`; the default system prompt tells
  Claude to refuse rather than invent. Keep it that way for a regulator audience.
- **Keys stay server-side.** Never import `fetch-helpers.ts` or `insight.ts` into a client component.
- **Have a fallback.** Cache a few JSON fixtures so a live API hiccup never stalls the demo.
