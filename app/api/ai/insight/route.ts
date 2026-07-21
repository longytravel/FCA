// POST /api/ai/insight — streamed plain-text phoenix risk briefing.
// Owner: agent D (ai). Body: { graph, focusId }.
import type { NextRequest } from "next/server";
import type { PhoenixGraph } from "@/src/lib/phoenix/types";
import {
  MODEL,
  anthropic,
  serializeGraph,
  sanitizeError,
  textStreamResponse,
} from "../_shared";

export const runtime = "nodejs";

const SYSTEM = `You are a supervisory analyst at the UK Financial Conduct Authority (FCA) reviewing a company/officer network for "phoenixing" — directors dissolving a fined or failed firm and re-emerging behind newly incorporated companies.

You will be given a graph as JSON (nodes = companies and officers, edges = appointments). Ground every statement STRICTLY in that JSON. Cite director names, company numbers and dates exactly as they appear. If a fact is not present in the data, say "not in the data" rather than inventing it.

Write a concise phoenix risk assessment of 3 to 6 sentences in plain prose (no headings, no bullet points, no markdown). Focus on the officer or firm in question: what the network suggests, which reused directors or addresses stand out, and how the timing of new incorporations relates to any dissolution or fine.`;

export async function POST(req: NextRequest) {
  let graph: PhoenixGraph | undefined;
  let focusId: string | undefined;
  try {
    const body = await req.json();
    graph = body?.graph;
    focusId = body?.focusId;
  } catch {
    return new Response("Invalid JSON body.", { status: 400 });
  }

  if (!graph) {
    return new Response("Missing graph.", { status: 400 });
  }

  const graphJson = serializeGraph(graph, focusId, 50_000);
  const userText = `Network graph (JSON):\n${graphJson}\n\nFocus node id: ${
    focusId ?? "(none — assess the whole network)"
  }\n\nWrite the phoenix risk assessment.`;

  try {
    return textStreamResponse(() =>
      anthropic.messages.stream({
        model: MODEL,
        max_tokens: 2000,
        output_config: { effort: "low" },
        system: SYSTEM,
        messages: [{ role: "user", content: userText }],
      }),
    );
  } catch (err) {
    return new Response(`[error: ${sanitizeError(err)}]`, { status: 500 });
  }
}
