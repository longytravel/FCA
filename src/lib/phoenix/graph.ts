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

export type OfficerScoring = {
  risk: number;
  riskFactors: RiskFactor[];
  dataCompleteness: number;
  unknownFactors: RiskFactor["key"][];
};

/** Officer node. Pass `scoring` only for officers we actually risk-scored; unscored
 *  officers (wrong role, or not present during the trouble window) stay in the graph
 *  with no risk attached. */
export function officerNode(id: string, name: string, scoring?: OfficerScoring): PNode {
  const node: PNode = { id, type: "officer", name, tags: [] };
  if (scoring) {
    node.risk = scoring.risk;
    node.riskFactors = scoring.riskFactors;
    node.dataCompleteness = scoring.dataCompleteness;
    node.unknownFactors = scoring.unknownFactors;
  }
  return node;
}

const CORP_NAME_RE = /\b(LIMITED|LTD|PLC|LLP|LLC|INC|GMBH|HOLDINGS|GROUP|NOMINEES|SECRETARIES|SERVICES|CORP|COMPANY|TRUSTEES)\b/i;

/** A name that looks like a corporate body rather than a human. */
export function looksLikeCompany(name?: string): boolean {
  return CORP_NAME_RE.test(name || "");
}

/** Only human director-type officers get risk-scored: exclude secretaries, corporate
 *  officers, and company-named entities. Includes directors and LLP/partnership members. */
export function isHumanDirectorRole(role?: string, name?: string): boolean {
  const r = (role || "").toLowerCase();
  if (r.includes("secretary")) return false;
  if (r.includes("corporate")) return false;
  const directorish = r.includes("director") || r.includes("member") || r.includes("partner");
  if (!directorish) return false;
  if (looksLikeCompany(name)) return false;
  return true;
}

const OVERLAP_GRACE_MS = 365 * 24 * 3600 * 1000; // ~12 months

/** Did this appointment overlap the firm's trouble window? Appointed on/before the reference
 *  date and not resigned more than ~12 months before it. No reference date → don't exclude. */
export function overlappedWindow(appointed_on?: string, resigned_on?: string, refDate?: string): boolean {
  if (!refDate) return true;
  const ref = new Date(refDate).getTime();
  if (isNaN(ref)) return true;
  if (appointed_on) {
    const a = new Date(appointed_on).getTime();
    if (!isNaN(a) && a > ref) return false; // appointed after the trouble date
  }
  if (resigned_on) {
    const res = new Date(resigned_on).getTime();
    if (!isNaN(res) && res < ref - OVERLAP_GRACE_MS) return false; // long gone before it
  }
  return true;
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
