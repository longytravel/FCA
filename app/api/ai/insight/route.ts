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

const SYSTEM = `You are briefing a busy FCA supervisor on possible "phoenixing" — directors of a fined or failed firm starting again behind new companies. You are given a company/officer network (companies and officers, with appointment dates). Every claim must come from that data; never invent facts.

Write it so a non-specialist reads it in 20 seconds:

VERDICT: <one short sentence — e.g. "Clear phoenix pattern around two directors." or "No sign of resurfacing in what we hold.">
Then 2-4 short, plain-English sentences. Name people and companies naturally ("Patrick McCreesh, who ran Blackmore Bond until it failed, now directs three active firms including X (incorporated March 2021)"). Prefer years over full dates; include a company number only when naming a specific new company.
WORTH CHECKING NEXT: <one short sentence>.

Hard rules: never mention JSON, data structures, node ids, tags like "phoenix-seed", or this briefing process. Never say "the data shows" — just state what is known and, if something is missing, say plainly what we don't yet hold (e.g. "We don't yet hold their other directorships."). No markdown, no bullet lists.`;

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
