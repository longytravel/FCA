// POST /api/ai/chat — agentic "Ask this network" analyst.
// Owner: agent D (ai). Body: { messages:[{role,content}], graph, fines? }.
// Response: NDJSON stream (one JSON object per line):
//   {"type":"text","delta":string}
//   {"type":"tool","name":string,"label":string}
//   {"type":"graph","nodes":[PNode...],"edges":[PEdge...]}
//   {"type":"done"}
import type { NextRequest } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import type { PhoenixGraph } from "@/src/lib/phoenix/types";
import {
  searchCompanies,
  getOfficers,
  getAppointments,
} from "@/src/lib/phoenix/ch";
import {
  MODEL,
  anthropic,
  serializeGraph,
  serializeFines,
  sanitizeError,
  capGraphJson,
  companyNodeFromSearch,
  graphFromOfficers,
  graphFromAppointments,
} from "../_shared";

export const runtime = "nodejs";

const MAX_ITERATIONS = 6;

const SYSTEM = `You are an FCA supervisory analyst answering questions about a company/officer network in an "Ask this network" chat. The topic is "phoenixing" — directors dissolving a fined or failed firm and re-emerging behind newly incorporated companies.

You are given the current network graph as JSON (nodes = companies and officers, edges = appointments) and, where available, enforcement fines as JSON. Ground your answers in that data first. When the user asks about something beyond the current graph, use the tools to investigate live Companies House data. Cite company numbers and dates exactly. If a fact is not available, say so rather than inventing it. Keep answers concise and analytical.`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: "search_companies",
    description:
      "Search live Companies House for companies matching a query (name or number). Use to find companies not already in the graph.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Company name or number to search for" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_officers",
    description:
      "List the officers (directors) of a company by its Companies House company number.",
    input_schema: {
      type: "object",
      properties: {
        company_number: { type: "string", description: "Companies House company number" },
      },
      required: ["company_number"],
    },
  },
  {
    name: "get_appointments",
    description:
      "List every company appointment for an officer by their Companies House officer id — the key move for spotting phoenix re-incorporations.",
    input_schema: {
      type: "object",
      properties: {
        officer_id: { type: "string", description: "Companies House officer id" },
      },
      required: ["officer_id"],
    },
  },
];

type ToolOutcome = {
  content: string;
  isError: boolean;
  graph?: PhoenixGraph;
};

function labelFor(name: string, input: any): string {
  switch (name) {
    case "search_companies":
      return `Searching Companies House for "${input?.query ?? ""}"`;
    case "get_officers":
      return `Looking up officers of ${input?.company_number ?? ""}`;
    case "get_appointments":
      return `Tracing appointments of officer ${input?.officer_id ?? ""}`;
    default:
      return `Running ${name}`;
  }
}

async function runTool(name: string, input: any): Promise<ToolOutcome> {
  try {
    if (name === "search_companies") {
      const items = await searchCompanies(String(input?.query ?? ""), 10);
      const nodes = (items || []).map(companyNodeFromSearch);
      const compact = (items || []).map((i: any) => ({
        company_number: i.company_number,
        title: i.title ?? i.company_name,
        company_status: i.company_status,
        date_of_creation: i.date_of_creation,
        address_snippet: i.address_snippet,
      }));
      return {
        content: capGraphJson({ nodes: compact, edges: [] }, 20_000),
        isError: false,
        graph: { nodes, edges: [] },
      };
    }
    if (name === "get_officers") {
      const num = String(input?.company_number ?? "");
      const officers = await getOfficers(num);
      const compact = (officers || []).map((o: any) => ({
        name: o.name,
        officer_role: o.officer_role,
        appointed_on: o.appointed_on,
        resigned_on: o.resigned_on,
        officer_id: o?.links?.officer?.appointments,
      }));
      return {
        content: JSON.stringify({ company_number: num, officers: compact }).slice(0, 20_000),
        isError: false,
        graph: graphFromOfficers(num, officers || []),
      };
    }
    if (name === "get_appointments") {
      const officerId = String(input?.officer_id ?? "");
      const appts = await getAppointments(officerId);
      const compact = (appts || []).map((a: any) => ({
        company_number: a?.appointed_to?.company_number,
        company_name: a?.appointed_to?.company_name,
        company_status: a?.appointed_to?.company_status,
        officer_role: a.officer_role,
        appointed_on: a.appointed_on,
        resigned_on: a.resigned_on,
      }));
      return {
        content: JSON.stringify({ officer_id: officerId, appointments: compact }).slice(0, 20_000),
        isError: false,
        graph: graphFromAppointments(officerId, appts || []),
      };
    }
    return { content: `[error: unknown tool ${name}]`, isError: true };
  } catch (err) {
    return { content: `[error: ${sanitizeError(err)}]`, isError: true };
  }
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body.", { status: 400 });
  }

  const graph: PhoenixGraph | undefined = body?.graph;
  const fines = body?.fines;
  const incoming = Array.isArray(body?.messages) ? body.messages : [];

  const graphJson = serializeGraph(graph, undefined, 50_000);
  const finesJson = serializeFines(fines, 15_000);
  const grounding = `Current network graph (JSON):\n${graphJson}\n\nFines (JSON):\n${finesJson}`;

  // Seed the conversation with the grounding context, then the chat history.
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: grounding },
    {
      role: "assistant",
      content:
        "Understood. I have the current network and fines in view and can investigate further with Companies House tools.",
    },
    ...incoming.map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content ?? ""),
    })),
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      try {
        for (let i = 0; i < MAX_ITERATIONS; i++) {
          const turn = anthropic.messages.stream({
            model: MODEL,
            max_tokens: 4000,
            output_config: { effort: "medium" },
            system: SYSTEM,
            messages,
            tools: TOOLS,
          });
          turn.on("text", (delta: string) => write({ type: "text", delta }));
          const final = await turn.finalMessage();

          messages.push({ role: "assistant", content: final.content });

          if (final.stop_reason !== "tool_use") break;

          const toolUses = final.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
          );

          // Run every tool_use block, then return ALL results in ONE user
          // message (matching tool_use_id), per the streaming tool loop.
          const results: Anthropic.ToolResultBlockParam[] = [];
          for (const tu of toolUses) {
            write({ type: "tool", name: tu.name, label: labelFor(tu.name, tu.input) });
            const outcome = await runTool(tu.name, tu.input as any);
            if (outcome.graph) {
              write({
                type: "graph",
                nodes: outcome.graph.nodes,
                edges: outcome.graph.edges,
              });
            }
            results.push({
              type: "tool_result",
              tool_use_id: tu.id,
              content: outcome.content,
              is_error: outcome.isError,
            });
          }
          messages.push({ role: "user", content: results });

          if (i === MAX_ITERATIONS - 1) {
            write({
              type: "text",
              delta:
                "\n\n[Reached the investigation step limit — ask a follow-up to continue.]",
            });
          }
        }
      } catch (err) {
        // Mid-stream failure (after headers): emit a recoverable error line,
        // then always terminate the stream with {"type":"done"}.
        write({ type: "error", message: sanitizeError(err) });
      } finally {
        write({ type: "done" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
    },
  });
}
