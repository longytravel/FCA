import type { PhoenixGraph, PNode, PEdge } from "@/src/lib/phoenix/types";

/** FCA brand tokens (extracted from live fca.org.uk). Kept local so this module
 *  never depends on globals.css theme names (rewritten concurrently by agent A). */
export const FCA = {
  mulberry: "#6c1d45",
  navy: "#003c71",
  teal: "#00bfb3",
  yellow: "#ffc72c",
  coral: "#ff585d",
  midblue: "#007fae",
  darkteal: "#004851",
  panel: "#f0f0f1",
  body: "#3f3f3f",
  rule: "#d2d2d4",
  muted: "#75767a",
  white: "#ffffff",
} as const;

/** The three headline cases (presenter keys 1/2/3, hero chips). */
export const CASES: { number: string; name: string; blurb: string }[] = [
  { number: "10273135", name: "Blackmore Bond PLC", blurb: "£46m mini-bond collapse" },
  { number: "08140312", name: "London Capital & Finance PLC", blurb: "£237m, 11,600 investors" },
  { number: "05433451", name: "Basset & Gold PLC", blurb: "£36m retail bonds" },
];

const DISSOLVED_RE = /dissolv|liquidat|administ|receiver|struck|closed|insolven/i;

export function isDissolvedStatus(status?: string): boolean {
  return !!status && DISSOLVED_RE.test(status);
}

export function isActiveStatus(status?: string): boolean {
  return !!status && /active|open/i.test(status);
}

/** A phoenix signal: an active company that rose from the linked network
 *  (explicit tag from the resolver, or an active linked co with an incorporation date). */
export function isPhoenixSignal(node: PNode): boolean {
  if (node.type !== "company") return false;
  if (node.tags?.includes("phoenix-signal")) return true;
  return (
    isActiveStatus(node.status) &&
    !!node.tags?.includes("linked") &&
    !!node.incorporated_on
  );
}

export function nodeColor(node: PNode): string {
  if (node.type === "officer") return FCA.navy;
  if (node.tags?.includes("phoenix-seed") || node.tags?.includes("fined-seed"))
    return FCA.mulberry;
  if (isPhoenixSignal(node)) return FCA.coral;
  if (isDissolvedStatus(node.status)) return FCA.muted;
  return FCA.mulberry;
}

/** Officer canvas radius from risk (0-100). Companies drawn as squares elsewhere. */
export function officerRadius(node: PNode): number {
  const risk = typeof node.risk === "number" ? node.risk : 0;
  return 4 + (risk / 100) * 7;
}

/** id accessor that tolerates force-graph's in-place source/target rewriting. */
export function endId(v: string | { id: string } | undefined): string {
  if (v == null) return "";
  return typeof v === "string" ? v : v.id;
}

function edgeKey(e: PEdge): string {
  return `${endId(e.source)}->${endId(e.target)}:${e.role}`;
}

/** Merge two graphs, de-duping nodes by id (union of tags, incoming fields win)
 *  and edges by source/target/role. Canonical state always keeps string endpoints. */
export function mergeGraph(base: PhoenixGraph, incoming: Partial<PhoenixGraph>): PhoenixGraph {
  const nodes = new Map<string, PNode>();
  for (const n of base.nodes) nodes.set(n.id, n);
  for (const n of incoming.nodes ?? []) {
    const prev = nodes.get(n.id);
    if (prev) {
      nodes.set(n.id, {
        ...prev,
        ...n,
        tags: Array.from(new Set([...(prev.tags ?? []), ...(n.tags ?? [])])),
        riskFactors: n.riskFactors ?? prev.riskFactors,
        risk: typeof n.risk === "number" ? n.risk : prev.risk,
      });
    } else {
      nodes.set(n.id, { ...n, tags: n.tags ?? [] });
    }
  }
  const edges = new Map<string, PEdge>();
  for (const e of base.edges) edges.set(edgeKey(e), { ...e, source: endId(e.source), target: endId(e.target) });
  for (const e of incoming.edges ?? []) edges.set(edgeKey(e), { ...e, source: endId(e.source), target: endId(e.target) });
  return { nodes: Array.from(nodes.values()), edges: Array.from(edges.values()) };
}

const EMPTY: PhoenixGraph = { nodes: [], edges: [] };
export const emptyGraph = (): PhoenixGraph => ({ ...EMPTY, nodes: [], edges: [] });

/** Parse a CH-style date (YYYY-MM-DD or DD/MM/YYYY) to epoch ms, or null. */
export function parseDate(d?: string | null): number | null {
  if (!d) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) {
    const ms = Date.parse(d);
    return Number.isNaN(ms) ? null : ms;
  }
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return Date.UTC(+m[3], +m[2] - 1, +m[1]);
  const ms = Date.parse(d);
  return Number.isNaN(ms) ? null : ms;
}

export function fmtDate(d?: string | null): string {
  const ms = parseDate(d);
  if (ms == null) return "—";
  return new Date(ms).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtMs(ms: number): string {
  return new Date(ms).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

/** Earliest date each node "appears" (incorporation, or earliest appointment on
 *  a connected edge) — used by the timeline replay. 0 = always visible (seed / undated). */
export function computeAppearance(graph: PhoenixGraph): {
  nodeAppear: Map<string, number>;
  edgeAppear: Map<string, number>;
  min: number;
  max: number;
} {
  const nodeAppear = new Map<string, number>();
  const edgeAppear = new Map<string, number>();
  let min = Infinity;
  let max = -Infinity;
  const track = (ms: number | null) => {
    if (ms == null) return;
    if (ms < min) min = ms;
    if (ms > max) max = ms;
  };

  for (const n of graph.nodes) {
    const inc = parseDate(n.incorporated_on);
    track(inc);
    const seed = n.tags?.some((t) => t === "phoenix-seed" || t === "fined-seed");
    nodeAppear.set(n.id, seed ? 0 : inc ?? Infinity);
  }
  for (const e of graph.edges) {
    const app = parseDate(e.appointed_on);
    track(app);
    const key = edgeKey(e);
    edgeAppear.set(key, app ?? 0);
    if (app != null) {
      for (const id of [endId(e.source), endId(e.target)]) {
        const cur = nodeAppear.get(id);
        if (cur == null || app < cur) nodeAppear.set(id, app);
      }
    }
  }
  // Any node still Infinity (no date at all) -> always visible.
  for (const [id, v] of nodeAppear) if (!Number.isFinite(v)) nodeAppear.set(id, 0);

  if (!Number.isFinite(min)) min = Date.UTC(2000, 0, 1);
  if (!Number.isFinite(max)) max = Date.now();
  return { nodeAppear, edgeAppear, min, max };
}

export { edgeKey };
