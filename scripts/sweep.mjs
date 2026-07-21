#!/usr/bin/env node
// scripts/sweep.mjs  (owner: C) — standalone Node ESM, no deps.
//
// Sweeps all 300 fined firms in data/fines.json against live Companies House:
//   fine → best-match company → officers → each director's appointments →
//   active linked companies → transparent risk score. Keeps only directors with
//   >=1 active linked company incorporated AFTER the fine date, OR risk >= 40.
//
// RESUMABLE: reloads data/fixtures/sweep-results.json and skips firms already
// processed (tracked in processedFirms). Writes incrementally every 10 firms so a
// crash loses little. Throttled ~150ms/request. Progress to stdout every 10 firms.
//
// Env: parses .env.local itself for COMPANIES_HOUSE_API_KEY (no dotenv dependency).
// Optional SWEEP_LIMIT=N processes only the first N fines (for smoke testing).
//
// The risk logic here mirrors src/lib/phoenix/risk.ts — kept in sync by hand because
// this script runs under plain `node` and cannot import the TypeScript module.

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const FINES_FILE = path.join(ROOT, "data", "fines.json");
const OUT_FILE = path.join(ROOT, "data", "fixtures", "sweep-results.json");

// ---------- env ----------
function loadEnvLocal() {
  const p = path.join(ROOT, ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim();
  }
}
loadEnvLocal();

const KEY = process.env.COMPANIES_HOUSE_API_KEY;
if (!KEY) {
  console.error("COMPANIES_HOUSE_API_KEY missing (set it in .env.local)");
  process.exit(1);
}
const AUTH = "Basic " + Buffer.from(KEY + ":").toString("base64");
const BASE = "https://api.company-information.service.gov.uk";
const LIMIT = Number(process.env.SWEEP_LIMIT || 0);

// ---------- throttled CH client ----------
const GAP_MS = 150;
const MAX_429_RETRIES = 4;
let lastCall = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function chGet(p) {
  const wait = Math.max(0, lastCall + GAP_MS - Date.now());
  if (wait) await sleep(wait);
  lastCall = Date.now();
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch(BASE + p, { headers: { Authorization: AUTH, Accept: "application/json" } });
    } catch (err) {
      if (attempt >= MAX_429_RETRIES) throw err;
      await sleep(2000);
      continue;
    }
    if (res.status === 404) return null;
    if (res.status === 429) {
      if (attempt >= MAX_429_RETRIES) throw new Error("429 rate limit");
      await sleep((Number(res.headers.get("retry-after")) || 3) * 1000);
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} ${p}`);
    return res.json();
  }
}

// ---------- helpers ----------
function parseFineDate(ddmmyyyy) {
  // "DD/MM/YYYY" -> ISO "YYYY-MM-DD"
  const m = (ddmmyyyy || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}
function core(s) {
  return (s || "")
    .toLowerCase()
    .replace(/\b(ltd|limited|plc|llp|lp|uk|group|holdings|company|co|the|and|&)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}
function bestMatch(firm, items) {
  const target = core(firm);
  if (!target) return null;
  let best = null;
  let bestScore = 0;
  for (const it of items) {
    const t = core(it.title || "");
    if (!t) continue;
    let score = 0;
    if (t === target) score = 1;
    else if (t.startsWith(target) || target.startsWith(t)) score = 0.85;
    else if (t.includes(target) || target.includes(t)) score = 0.7;
    if (score > bestScore) {
      bestScore = score;
      best = it;
    }
  }
  return bestScore >= 0.7 ? best : null;
}
function flattenAddress(a) {
  if (!a || typeof a !== "object") return undefined;
  return [a.premises, a.address_line_1, a.address_line_2, a.locality, a.region, a.postal_code]
    .filter(Boolean)
    .join(", ");
}
function officerId(o) {
  const appts = o?.links?.officer?.appointments;
  if (typeof appts === "string") {
    const m = appts.match(/\/officers\/([^/]+)\/appointments/);
    if (m) return m[1];
  }
  return null;
}

// ---------- risk (mirror of src/lib/phoenix/risk.ts) ----------
const YEAR_MS = 365.25 * 24 * 3600 * 1000;
const ONE_MONTH_MS = 30 * 24 * 3600 * 1000;
const parseD = (s) => {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};
const normAddr = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const isActive = (s) => (s || "").toLowerCase() === "active";

function scoreOfficer({ seedName, seedCollapseDate, seedAddress, seedSic, linked, coDirectorCompanies }) {
  const factors = [];
  const active = linked.filter((c) => isActive(c.status));
  const collapse = parseD(seedCollapseDate);

  if (collapse) {
    const after = linked
      .filter((c) => isActive(c.status))
      .map((c) => ({ c, inc: parseD(c.incorporated_on) }))
      .filter((x) => x.inc && x.inc.getTime() >= collapse.getTime() - ONE_MONTH_MS)
      .sort((a, b) => a.inc.getTime() - b.inc.getTime());
    if (after.length) {
      const nearest = after[0];
      const gapYears = Math.max(0, (nearest.inc.getTime() - collapse.getTime()) / YEAR_MS);
      if (gapYears <= 2) {
        const points = Math.max(0, Math.round(30 * (1 - gapYears / 2)));
        const gapMonths = Math.round(gapYears * 12);
        factors.push({
          key: "gap",
          label: "Rapid re-incorporation after collapse",
          points,
          detail: `${nearest.c.name} (${nearest.c.number}) was incorporated ${nearest.c.incorporated_on}, ${gapMonths} month${gapMonths === 1 ? "" : "s"} after ${seedName}'s fine (${seedCollapseDate}).`,
        });
      }
    }
  }

  const seedA = normAddr(seedAddress);
  if (seedA) {
    const match = active.find((c) => normAddr(c.address) && normAddr(c.address) === seedA);
    if (match)
      factors.push({
        key: "same_address",
        label: "Shares registered address with fined firm",
        points: 25,
        detail: `${match.name} (${match.number}) is registered at the same address as ${seedName}: ${match.address}.`,
      });
  }

  const seedS = new Set((seedSic || []).map(String));
  if (seedS.size) {
    const match = active.find((c) => (c.sic_codes || []).some((s) => seedS.has(String(s))));
    if (match) {
      const shared = (match.sic_codes || []).filter((s) => seedS.has(String(s)));
      factors.push({
        key: "same_sic",
        label: "Same industry classification (SIC)",
        points: 15,
        detail: `${match.name} (${match.number}) shares SIC code${shared.length > 1 ? "s" : ""} ${shared.join(", ")} with ${seedName}.`,
      });
    }
  }

  const coDir = coDirectorCompanies || 0;
  if (coDir > 0)
    factors.push({
      key: "co_director",
      label: "Co-director overlap with fined firm",
      points: 15,
      detail: `${coDir} linked compan${coDir === 1 ? "y also shares" : "ies also share"} another ${seedName} director.`,
    });

  if (active.length) {
    const points = Math.min(15, active.length * 5);
    factors.push({
      key: "active_count",
      label: "Multiple active linked companies",
      points,
      detail: `${active.length} active compan${active.length === 1 ? "y is" : "ies are"} linked to this director.`,
    });
  }

  const score = Math.min(100, factors.reduce((s, f) => s + f.points, 0));
  return { score, factors };
}

// ---------- output state ----------
function loadState() {
  if (fs.existsSync(OUT_FILE)) {
    try {
      const j = JSON.parse(fs.readFileSync(OUT_FILE, "utf8"));
      return {
        results: Array.isArray(j.results) ? j.results : [],
        processedFirms: Array.isArray(j.processedFirms) ? j.processedFirms : [],
      };
    } catch {
      /* corrupt/partial — start fresh */
    }
  }
  return { results: [], processedFirms: [] };
}
function save(state) {
  const payload = {
    generatedAt: new Date().toISOString(),
    processedFirms: state.processedFirms,
    results: state.results,
  };
  fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2));
}

const APPTS_PER_DIRECTOR = 40;
const PROFILE_BUDGET_PER_FIRM = 30;

async function processFine(fine) {
  const fineDate = parseFineDate(fine.date);
  const search = await chGet(`/search/companies?q=${encodeURIComponent(fine.firm)}&items_per_page=10`);
  const match = bestMatch(fine.firm, search?.items ?? []);
  if (!match) return { skipped: true };

  const companyNumber = match.company_number;
  const profile = await chGet(`/company/${companyNumber}`);
  if (!profile) return { skipped: true };

  const seedAddress = flattenAddress(profile.registered_office_address);
  const seedSic = profile.sic_codes || [];
  const seedName = profile.company_name || match.title;

  const officersBody = await chGet(`/company/${companyNumber}/officers?items_per_page=35`);
  const directors = (officersBody?.items ?? []).filter((o) =>
    String(o.officer_role || "").toLowerCase().includes("director"),
  );

  // gather each director's appointments first (for co-director overlap)
  const gathered = [];
  for (const d of directors) {
    const id = officerId(d);
    if (!id) continue;
    const apptsBody = await chGet(`/officers/${id}/appointments?items_per_page=50`);
    gathered.push({ name: d.name, id, appts: (apptsBody?.items ?? []).slice(0, APPTS_PER_DIRECTOR) });
  }

  const companyOfficers = new Map();
  for (const g of gathered) {
    for (const a of g.appts) {
      const cn = a?.appointed_to?.company_number;
      if (!cn || cn === companyNumber) continue;
      if (!companyOfficers.has(cn)) companyOfficers.set(cn, new Set());
      companyOfficers.get(cn).add(g.id);
    }
  }

  const profileCache = new Map();
  let budget = PROFILE_BUDGET_PER_FIRM;
  async function linkedProfile(cn) {
    if (profileCache.has(cn)) return profileCache.get(cn);
    if (budget <= 0) return null;
    budget--;
    const p = await chGet(`/company/${cn}`);
    profileCache.set(cn, p);
    return p;
  }

  const keptDirectors = [];
  for (const g of gathered) {
    const linked = [];
    let coDirectorCompanies = 0;
    const seen = new Set();
    for (const a of g.appts) {
      const cn = a?.appointed_to?.company_number;
      if (!cn || cn === companyNumber || seen.has(cn)) continue;
      seen.add(cn);
      const shared = companyOfficers.get(cn);
      if (shared && shared.size > 1) coDirectorCompanies++;
      // only spend a profile fetch on companies that could be active
      const preStatus = a?.appointed_to?.company_status;
      if (preStatus && !isActive(preStatus)) {
        linked.push({ number: cn, name: a?.appointed_to?.company_name || cn, status: preStatus });
        continue;
      }
      const p = await linkedProfile(cn);
      if (p) {
        linked.push({
          number: cn,
          name: p.company_name || a?.appointed_to?.company_name || cn,
          status: p.company_status,
          incorporated_on: p.date_of_creation,
          address: flattenAddress(p.registered_office_address),
          sic_codes: p.sic_codes || [],
        });
      } else {
        linked.push({ number: cn, name: a?.appointed_to?.company_name || cn, status: preStatus });
      }
    }

    const { score, factors } = scoreOfficer({
      seedName,
      seedCollapseDate: fineDate,
      seedAddress,
      seedSic,
      linked,
      coDirectorCompanies,
    });

    const activeAfterFine = linked.filter(
      (c) =>
        isActive(c.status) &&
        c.incorporated_on &&
        fineDate &&
        new Date(c.incorporated_on).getTime() >= new Date(fineDate).getTime() - ONE_MONTH_MS,
    );

    if (activeAfterFine.length >= 1 || score >= 40) {
      keptDirectors.push({
        name: g.name,
        officerId: g.id,
        risk: score,
        riskFactors: factors,
        activeCompanies: linked
          .filter((c) => isActive(c.status))
          .map((c) => ({
            number: c.number,
            name: c.name,
            incorporated_on: c.incorporated_on || null,
            status: c.status || null,
          })),
      });
    }
  }

  if (!keptDirectors.length) return { skipped: false, result: null };
  return {
    skipped: false,
    result: {
      firm: fine.firm,
      fineDate,
      amount: fine.amount,
      companyNumber,
      matchedName: seedName,
      directors: keptDirectors,
    },
  };
}

// ---------- main ----------
async function main() {
  const fines = JSON.parse(fs.readFileSync(FINES_FILE, "utf8"));
  const rows = (LIMIT > 0 ? fines.slice(0, LIMIT) : fines);
  const state = loadState();
  const done = new Set(state.processedFirms);

  console.log(`Sweep starting: ${rows.length} fines (${done.size} already processed)`);
  let processed = 0;
  let skipped = 0;
  let kept = 0;

  for (let i = 0; i < rows.length; i++) {
    const fine = rows[i];
    const firmKey = `${fine.firm}|${fine.date}`;
    if (done.has(firmKey)) continue;

    try {
      const out = await processFine(fine);
      if (out.skipped) {
        skipped++;
      } else if (out.result) {
        state.results.push(out.result);
        kept++;
      }
    } catch (e) {
      console.log(`  ! ${fine.firm}: ${e.message}`);
    }
    done.add(firmKey);
    state.processedFirms.push(firmKey);
    processed++;

    if (processed % 10 === 0) {
      save(state);
      console.log(
        `  ...${processed} processed this run (${state.results.length} firms with hits, ${skipped} weak-match skips)`,
      );
    }
  }

  save(state);
  console.log(
    `Sweep done. ${processed} processed this run, ${state.results.length} firms with resurfaced directors, ${skipped} weak-match skips.`,
  );
  console.log(`Written: ${OUT_FILE}`);
}

main().catch((e) => {
  console.error("Sweep failed:", e);
  process.exit(1);
});
