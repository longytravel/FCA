// src/lib/phoenix/ch.ts  (owner: C; agent D imports these — signatures are FROZEN per build spec)
// Server-side Companies House client. Basic auth with COMPANIES_HOUSE_API_KEY as the
// username and an empty password. Politely throttled (CH allows 600 req / 5 min) and
// backed by an in-memory TTL cache per server instance. The API key never leaves the server.

import type { PhoenixGraph, PNode, PEdge } from "./types";
import { companyNode, stubCompanyNode, officerNode, officerIdFromLinks, mergeGraph, emptyGraph } from "./graph";
import { scoreOfficer, type LinkedCo } from "./risk";

const BASE = "https://api.company-information.service.gov.uk";
const MIN_GAP_MS = 120; // spacing between outbound calls (well under the 600/5min ceiling)
const CACHE_TTL_MS = 5 * 60_000;
const MAX_429_RETRIES = 3;

// Caps for a single resolvePhoenixGraph call — bound the request fan-out so one lookup
// can't blow the rate limit. Tunable; noted here so they stay visible.
const LINKED_PROFILE_CAP = 25; // max linked-company profiles fetched per resolve
const APPTS_PER_OFFICER = 40; // max appointments examined per officer

export class ChError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ChError";
    this.status = status;
  }
}

type CacheEntry = { data: unknown; expires: number };
const cache = new Map<string, CacheEntry>();

let lastCall = 0;
let gate: Promise<unknown> = Promise.resolve();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function authHeader(): string {
  const key = process.env.COMPANIES_HOUSE_API_KEY;
  if (!key) throw new ChError("COMPANIES_HOUSE_API_KEY is not set", 0);
  return "Basic " + Buffer.from(key + ":").toString("base64");
}

// One network call with 404 → null and 429 → bounded retry-after backoff.
async function rawFetch(path: string): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(BASE + path, {
      headers: { Authorization: authHeader(), Accept: "application/json" },
    });
    if (res.status === 404) return null;
    if (res.status === 429) {
      if (attempt >= MAX_429_RETRIES) throw new ChError("Companies House rate limit (429) exceeded", 429);
      const retryAfter = Number(res.headers.get("retry-after")) || 2;
      await sleep(retryAfter * 1000);
      continue;
    }
    if (!res.ok) throw new ChError(`Companies House responded ${res.status} for ${path}`, res.status);
    return res.json();
  }
}

// Basic-auth proxy to CH: cached, then serialized+spaced through the throttle gate.
export async function chGet(path: string): Promise<any> {
  const hit = cache.get(path);
  if (hit && hit.expires > Date.now()) return hit.data;

  const run = gate.then(async () => {
    const wait = Math.max(0, lastCall + MIN_GAP_MS - Date.now());
    if (wait) await sleep(wait);
    lastCall = Date.now();
    return rawFetch(path);
  });
  gate = run.catch(() => {}); // keep the chain alive even if this call throws
  const data = await run;

  cache.set(path, { data, expires: Date.now() + CACHE_TTL_MS });
  return data;
}

export async function searchCompanies(q: string, limit = 8): Promise<any[]> {
  if (!q || !q.trim()) return [];
  const body = await chGet(`/search/companies?q=${encodeURIComponent(q.trim())}&items_per_page=${limit}`);
  return (body?.items as any[]) ?? [];
}

export async function getCompanyProfile(num: string): Promise<any> {
  return chGet(`/company/${encodeURIComponent(num.trim())}`);
}

export async function getOfficers(num: string): Promise<any[]> {
  const body = await chGet(`/company/${encodeURIComponent(num.trim())}/officers?items_per_page=35`);
  return (body?.items as any[]) ?? [];
}

export async function getAppointments(officerId: string): Promise<any[]> {
  const body = await chGet(`/officers/${encodeURIComponent(officerId)}/appointments?items_per_page=50`);
  return (body?.items as any[]) ?? [];
}

// Full chain: profile → officers → each officer's appointments → linked-company profiles,
// assembled into a PhoenixGraph with tags and per-officer transparent risk scores.
export async function resolvePhoenixGraph(companyNumber: string): Promise<PhoenixGraph> {
  const num = companyNumber.trim().toUpperCase();
  const profile = await getCompanyProfile(num);
  if (!profile) return emptyGraph(); // not found — route turns this into a 404

  const nodes: PNode[] = [];
  const edges: PEdge[] = [];

  const seedNode = companyNode(profile, ["phoenix-seed"]);
  nodes.push(seedNode);
  const seedAddress = seedNode.address;
  const seedSic = seedNode.sic_codes;
  const seedCollapse = seedNode.dissolved_on || seedNode.incorporated_on || undefined;

  const officers = await getOfficers(num);

  type OffData = {
    id: string;
    name: string;
    role: string;
    appointed_on?: string;
    resigned_on?: string;
    appts: any[];
  };
  const offs: OffData[] = [];
  for (const o of officers) {
    const id = officerIdFromLinks(o);
    if (!id) continue;
    const appts = (await getAppointments(id)).slice(0, APPTS_PER_OFFICER);
    offs.push({
      id,
      name: String(o.name ?? id),
      role: String(o.officer_role ?? "officer"),
      appointed_on: o.appointed_on,
      resigned_on: o.resigned_on,
      appts,
    });
  }

  // Which seed officers touch each linked company — powers the co-director signal.
  const companyOfficers = new Map<string, Set<string>>();
  for (const off of offs) {
    for (const a of off.appts) {
      const cn = a?.appointed_to?.company_number;
      if (!cn || cn === num) continue;
      if (!companyOfficers.has(cn)) companyOfficers.set(cn, new Set());
      companyOfficers.get(cn)!.add(off.id);
    }
  }

  // Shared linked-company profile budget across the whole resolve (see LINKED_PROFILE_CAP).
  const profileCache = new Map<string, any>();
  let budget = LINKED_PROFILE_CAP;
  async function linkedProfile(cn: string): Promise<any> {
    if (profileCache.has(cn)) return profileCache.get(cn);
    if (budget <= 0) return null;
    budget--;
    const p = await getCompanyProfile(cn);
    profileCache.set(cn, p);
    return p;
  }

  for (const off of offs) {
    edges.push({
      source: off.id,
      target: num,
      role: off.role,
      appointed_on: off.appointed_on,
      resigned_on: off.resigned_on,
    });

    const linkedForRisk: LinkedCo[] = [];
    let coDirectorCompanies = 0;

    for (const a of off.appts) {
      const cn = a?.appointed_to?.company_number;
      if (!cn || cn === num) continue;
      const cname = String(a?.appointed_to?.company_name ?? cn);

      edges.push({
        source: off.id,
        target: cn,
        role: String(a?.officer_role ?? "officer"),
        appointed_on: a?.appointed_on,
        resigned_on: a?.resigned_on,
      });

      const sharedSet = companyOfficers.get(cn);
      if (sharedSet && sharedSet.size > 1) coDirectorCompanies++;

      const p = await linkedProfile(cn);
      if (p) {
        const cnode = companyNode(p, ["linked"]);
        nodes.push(cnode);
        linkedForRisk.push({
          number: cnode.id,
          name: cnode.name,
          status: cnode.status,
          incorporated_on: cnode.incorporated_on,
          address: cnode.address,
          sic_codes: cnode.sic_codes,
        });
      } else {
        nodes.push(stubCompanyNode(cn, cname, ["linked"]));
      }
    }

    const { score, factors } = scoreOfficer({
      seedName: seedNode.name,
      seedCollapseDate: seedCollapse,
      seedAddress,
      seedSic,
      linked: linkedForRisk,
      coDirectorCompanies,
    });
    nodes.push(officerNode(off.id, off.name, score, factors));
  }

  // mergeGraph dedupes companies linked by multiple officers and unions their tags.
  return mergeGraph(emptyGraph(), { nodes, edges });
}
