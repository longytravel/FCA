// POST /api/ai/dossier — streamed markdown supervisory dossier.
// Owner: agent D (ai). Body: { graph, focusId, fines }.
import type { NextRequest } from "next/server";
import type { PhoenixGraph } from "@/src/lib/phoenix/types";
import {
  MODEL,
  anthropic,
  serializeGraph,
  serializeFines,
  sanitizeError,
  textStreamResponse,
} from "../_shared";

export const runtime = "nodejs";

const SYSTEM = `You are a supervisory analyst at the UK Financial Conduct Authority (FCA) preparing a formal supervisory dossier on a possible "phoenix" network — directors dissolving a fined or failed firm and re-emerging behind newly incorporated companies.

You will be given a network graph as JSON (nodes = companies and officers, edges = appointments) and a list of enforcement fines as JSON. Ground every statement STRICTLY in that data. Cite director names, company numbers and dates exactly as they appear. If something is not present, write "not in the data" rather than inventing it.

Output GitHub-flavoured markdown ONLY, with exactly these sections in order:

# Supervisory dossier: <firm or officer name>

## Executive summary
A short paragraph on the phoenix risk and why it matters.

## Entities
A markdown table of the key companies and officers: | Entity | Type | Company no. / Officer | Status | Incorporated | Dissolved | Risk |

## Chronology
A dated, bulleted timeline interleaving the fine date(s), any dissolution, and the new incorporations — earliest first.

## Risk assessment
The transparent reasoning: reused addresses, reused SIC codes, co-director overlap, and the gap between dissolution/fine and re-incorporation.

## Recommended supervisory action
Concrete, proportionate next steps for the supervisor.

Be precise and factual. Do not fabricate figures or dates.`;

export async function POST(req: NextRequest) {
  let graph: PhoenixGraph | undefined;
  let focusId: string | undefined;
  let fines: unknown;
  try {
    const body = await req.json();
    graph = body?.graph;
    focusId = body?.focusId;
    fines = body?.fines;
  } catch {
    return new Response("Invalid JSON body.", { status: 400 });
  }

  if (!graph) {
    return new Response("Missing graph.", { status: 400 });
  }

  const graphJson = serializeGraph(graph, focusId, 50_000);
  const finesJson = serializeFines(fines, 20_000);
  const userText = `Network graph (JSON):\n${graphJson}\n\nFines (JSON):\n${finesJson}\n\nFocus node id: ${
    focusId ?? "(none)"
  }\n\nWrite the supervisory dossier as markdown.`;

  try {
    return textStreamResponse(() =>
      anthropic.messages.stream({
        model: MODEL,
        max_tokens: 4000,
        output_config: { effort: "medium" },
        system: SYSTEM,
        messages: [{ role: "user", content: userText }],
      }),
    );
  } catch (err) {
    return new Response(`[error: ${sanitizeError(err)}]`, { status: 500 });
  }
}
