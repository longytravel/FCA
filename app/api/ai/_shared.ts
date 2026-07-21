// Shared helpers for the Claude-powered /api/ai routes.
// Owner: agent D (ai). Do not edit outside app/api/ai/**.
import Anthropic from "@anthropic-ai/sdk";
import type { PNode, PEdge, PhoenixGraph } from "@/src/lib/phoenix/types";

export const MODEL = "claude-opus-4-8";

// new Anthropic() picks up ANTHROPIC_API_KEY from the environment.
export const anthropic = new Anthropic();

// ---- Graph serialization -------------------------------------------------

function byteLen(s: string): number {
  return Buffer.byteLength(s, "utf8");
}

// Stringify {nodes,edges}, trimming the arrays until it fits under maxBytes.
export function capGraphJson(
  obj: { nodes: unknown[]; edges: unknown[] },
  maxBytes: number,
): string {
  let s = JSON.stringify(obj);
  if (byteLen(s) <= maxBytes) return s;
  const clone = { nodes: [...(obj.nodes || [])], edges: [...(obj.edges || [])] };
  while (
    byteLen(JSON.stringify(clone)) > maxBytes &&
    (clone.nodes.length || clone.edges.length)
  ) {
    // Trim the larger array first; edges are cheaper context than nodes.
    if (clone.edges.length >= clone.nodes.length && clone.edges.length) {
      clone.edges.pop();
    } else if (clone.nodes.length) {
      clone.nodes.pop();
    } else {
      clone.edges.pop();
    }
  }
  return JSON.stringify(clone);
}

// Serialize the subgraph around focusId (± 1 hop). Without focusId, the whole
// graph, capped to ~maxBytes.
export function serializeGraph(
  graph: PhoenixGraph | undefined,
  focusId?: string,
  maxBytes = 50_000,
): string {
  if (!graph || !Array.isArray(graph.nodes)) return "{}";
  const edges = Array.isArray(graph.edges) ? graph.edges : [];
  if (!focusId) {
    return capGraphJson({ nodes: graph.nodes, edges }, maxBytes);
  }
  const keep = new Set<string>([focusId]);
  for (const e of edges) {
    if (e.source === focusId) keep.add(e.target);
    if (e.target === focusId) keep.add(e.source);
  }
  const nodes = graph.nodes.filter((n: PNode) => keep.has(n.id));
  const subEdges = edges.filter(
    (e: PEdge) => keep.has(e.source) && keep.has(e.target),
  );
  return capGraphJson({ nodes, edges: subEdges }, maxBytes);
}

// Serialize a fines list compactly, capped to ~maxBytes.
export function serializeFines(fines: unknown, maxBytes = 20_000): string {
  if (!Array.isArray(fines)) return "[]";
  let arr = fines as unknown[];
  let s = JSON.stringify(arr);
  while (byteLen(s) > maxBytes && arr.length) {
    arr = arr.slice(0, Math.max(0, arr.length - Math.ceil(arr.length / 10)));
    s = JSON.stringify(arr);
  }
  return s;
}

// ---- Errors --------------------------------------------------------------

// Never leak the API key or raw internals; return a short, safe description.
export function sanitizeError(err: unknown): string {
  if (err instanceof Anthropic.APIError) {
    return `Claude API error${err.status ? ` (${err.status})` : ""}`;
  }
  if (err instanceof Error) {
    // Strip anything key-shaped just in case a message echoes headers.
    return err.message.replace(/sk-[a-zA-Z0-9-]+/g, "[redacted]").slice(0, 200);
  }
  return "unexpected error";
}

// ---- Plain-text streaming (insight, dossier) -----------------------------

// Build a text/plain streamed Response from an Anthropic message stream,
// forwarding text deltas as they arrive.
export function textStreamResponse(
  build: () => ReturnType<typeof anthropic.messages.stream>,
): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const stream = build();
        stream.on("text", (delta: string) => {
          controller.enqueue(encoder.encode(delta));
        });
        await stream.finalMessage();
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `\n\n[Generation failed: ${sanitizeError(err)} — try again.]`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
    },
  });
}

// ---- Tool-result → graph conversion (chat) -------------------------------

// CH officer-list items link to /officers/{id}/appointments; pull out {id}.
export function officerIdFromLinks(item: any): string | undefined {
  const path: string | undefined = item?.links?.officer?.appointments ?? item?.links?.self;
  if (!path) return undefined;
  const parts = path.split("/").filter(Boolean); // ["officers", "{id}", ...]
  const idx = parts.indexOf("officers");
  return idx >= 0 ? parts[idx + 1] : undefined;
}

export function companyNodeFromSearch(item: any): PNode {
  return {
    id: String(item.company_number),
    type: "company",
    name: item.title ?? item.company_name ?? String(item.company_number),
    status: item.company_status,
    incorporated_on: item.date_of_creation,
    tags: ["linked"],
    address: item.address_snippet,
  };
}

// From get_officers(company_number): officer nodes + company→officer edges,
// plus a light company node so edges are never dangling on merge.
export function graphFromOfficers(
  companyNumber: string,
  officers: any[],
): PhoenixGraph {
  const nodes: PNode[] = [
    { id: companyNumber, type: "company", name: companyNumber, tags: ["linked"] },
  ];
  const edges: PEdge[] = [];
  for (const o of officers) {
    const officerId = officerIdFromLinks(o);
    if (!officerId) continue;
    nodes.push({
      id: officerId,
      type: "officer",
      name: o.name ?? officerId,
      tags: ["linked"],
    });
    edges.push({
      source: companyNumber,
      target: officerId,
      role: o.officer_role ?? "officer",
      appointed_on: o.appointed_on,
      resigned_on: o.resigned_on,
    });
  }
  return { nodes, edges };
}

// From get_appointments(officer_id): company nodes + officer→company edges.
export function graphFromAppointments(
  officerId: string,
  appointments: any[],
): PhoenixGraph {
  const nodes: PNode[] = [];
  const edges: PEdge[] = [];
  for (const a of appointments) {
    const at = a?.appointed_to ?? {};
    const num = at.company_number;
    if (!num) continue;
    nodes.push({
      id: String(num),
      type: "company",
      name: at.company_name ?? String(num),
      status: at.company_status,
      tags: ["linked"],
    });
    edges.push({
      source: officerId,
      target: String(num),
      role: a.officer_role ?? "officer",
      appointed_on: a.appointed_on,
      resigned_on: a.resigned_on,
    });
  }
  return { nodes, edges };
}
