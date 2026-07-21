// src/lib/phoenix/graph.ts  (owner: C)
// Pure helpers for turning raw Companies House payloads into PhoenixGraph pieces,
// plus a deduping merge. No network here — ch.ts wires these to live data.

import type { PNode, PEdge, PhoenixGraph, RiskFactor } from "./types";

export function emptyGraph(): PhoenixGraph {
  return { nodes: [], edges: [] };
}

/** Extract the stable officer id from a CH officer's links (…/officers/{id}/appointments). */
export function officerIdFromLinks(officer: unknown): string | null {
  const links = (officer as { links?: { officer?: { appointments?: unknown } } })?.links;
  const appts = links?.officer?.appointments;
  if (typeof appts === "string") {
    const m = appts.match(/\/officers\/([^/]+)\/appointments/);
    if (m) return m[1];
  }
  return null;
}

/** Flatten a CH registered_office_address object into a single display string. */
export function formatAddress(a: unknown): string | undefined {
  if (!a || typeof a !== "object") return undefined;
  const o = a as Record<string, string | undefined>;
  const parts = [o.premises, o.address_line_1, o.address_line_2, o.locality, o.region, o.postal_code]
    .filter(Boolean)
    .join(", ");
  return parts || undefined;
}

/** Build a company PNode from a CH company profile (or search item). */
export function companyNode(profile: Record<string, unknown>, tags: string[]): PNode {
  const number = String(profile.company_number ?? "");
  return {
    id: number,
    type: "company",
    name: String(profile.company_name ?? profile.title ?? number),
    status: profile.company_status as string | undefined,
    incorporated_on: (profile.date_of_creation as string | undefined) ?? undefined,
    dissolved_on: (profile.date_of_dissolution as string | undefined) ?? undefined,
    tags,
    address: formatAddress(profile.registered_office_address),
    sic_codes: (profile.sic_codes as string[] | undefined) ?? [],
  };
}

/** Lightweight company node when we only know name+number (profile fetch skipped/404). */
export function stubCompanyNode(number: string, name: string, tags: string[]): PNode {
  return { id: number, type: "company", name: name || number, tags };
}

export function officerNode(id: string, name: string, risk: number, riskFactors: RiskFactor[]): PNode {
  return { id, type: "officer", name, tags: [], risk, riskFactors };
}

const edgeKey = (e: PEdge) => `${e.source}->${e.target}:${e.role}`;

/** Merge `incoming` into `base`: dedupe nodes by id (unioning tags, preferring richer fields)
 *  and edges by source→target:role. Returns a fresh graph. */
export function mergeGraph(base: PhoenixGraph, incoming: PhoenixGraph): PhoenixGraph {
  const nodes = new Map<string, PNode>();
  for (const n of base.nodes) nodes.set(n.id, n);
  for (const n of incoming.nodes) {
    const existing = nodes.get(n.id);
    if (!existing) {
      nodes.set(n.id, n);
    } else {
      nodes.set(n.id, {
        ...existing,
        ...n,
        tags: Array.from(new Set([...(existing.tags || []), ...(n.tags || [])])),
        // keep the richer risk breakdown if either side has one
        risk: n.risk ?? existing.risk,
        riskFactors: n.riskFactors ?? existing.riskFactors,
      });
    }
  }

  const edges = new Map<string, PEdge>();
  for (const e of base.edges) edges.set(edgeKey(e), e);
  for (const e of incoming.edges) if (!edges.has(edgeKey(e))) edges.set(edgeKey(e), e);

  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}
