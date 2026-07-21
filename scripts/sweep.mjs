#!/usr/bin/env node
// scripts/sweep.mjs  (owner: C) — standalone Node ESM, no deps.
//
// Sweeps the FCA enforcement actions in data/fines.json against live Companies House.
//   entity → best-match company → officers → each director's appointments →
//   active linked companies → transparent risk score with confidence.
//
// INPUT HYGIENE (data/fines.json rows are enforcement actions, not clean companies):
//   - repeat actions against the same firm are merged into one entity (all fine events kept);
//   - rows that look like named individuals are skipped;
//   - rows that bundle multiple firms are skipped;
//   - every skip/no-match is recorded in output.skipped[] so coverage is honest.
//
// RISK ATTRIBUTION: only human director-type officers who were present during the firm's
// fine window are scored; others are ignored. Scores carry dataCompleteness + unknownFactors
// so missing evidence never reads as low risk.
//
// RESUMABLE: reloads data/fixtures/sweep-results.json and skips entities already processed.
// Writes incrementally every 10 entities. Throttled ~150ms/request. Progress every 10.
//
// Env: parses .env.local itself for COMPANIES_HOUSE_API_KEY (no dotenv dependency).
// Optional SWEEP_LIMIT=N processes only the first N entities (for smoke testing).
//
// The risk + role logic here mirrors src/lib/phoenix/{risk,graph}.ts — kept in sync by hand
// because this script runs under plain `node` and cannot import the TypeScript modules.

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

// ---------- date parsing (tolerant) ----------
const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7,
  august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};
function parseFineDate(raw, yearFallback) {
  const s = (raw || "").trim();
  let m;
  if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) {
    return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`; // DD/MM/YYYY
  }
  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) return `${m[1]}-${m[2]}-${m[3]}`; // YYYY-MM-DD
  if ((m = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/))) {
    const mo = MONTHS[m[2].toLowerCase()];
    if (mo) return `${m[3]}-${String(mo).padStart(2, "0")}-${m[1].padStart(2, "0")}`; // "D Month YYYY"
  }
  if (s) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  if (yearFallback) return `${yearFallback}-01-01`; // fall back to the year column
  return null;
}

// ---------- input hygiene ----------
const CORP_TOKENS =
  /\b(ltd|limited|plc|llp|llc|inc|lp|bank|group|holdings|capital|securities|insurance|assurance|asset|management|partners|partnership|financial|finance|investments?|advisers?|advisors?|mortgages?|trading|markets|funds?|services|international|nominees|trustees|corporation|corp|company|society|union|associates|brokers?|wealth|pensions?|life|credit|solutions|payments?|exchange|global)\b/i;
const TITLE_PREFIX = /^(mr|mrs|ms|miss|dr|sir|lord|lady|prof)\.?\s+/i;

function stripTitles(s) {
  let out = s.trim();
  while (TITLE_PREFIX.test(out)) out = out.replace(TITLE_PREFIX, "");
  return out;
}
function looksLikeIndividual(firm) {
  const s = stripTitles(firm);
  if (CORP_TOKENS.test(s)) return false;
  // 2-3 words, purely alphabetic (allowing hyphen/apostrophe), no digits → likely a person
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 3) return false;
  return words.every((w) => /^[A-Za-z][A-Za-z'’-]*$/.test(w));
}
function looksLikeMultiFirm(firm) {
  if (/\band others\b|\bet al\b/i.test(firm)) return true;
  const corpCount = (firm.match(new RegExp(CORP_TOKENS.source, "gi")) || []).length;
  return corpCount >= 2 && /(\band\b|&|,|\/|\+)/i.test(firm);
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

// ---------- CH helpers ----------
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

// ---------- role / overlap (mirror of src/lib/phoenix/graph.ts) ----------
const CORP_NAME_RE = /\b(LIMITED|LTD|PLC|LLP|LLC|INC|GMBH|HOLDINGS|GROUP|NOMINEES|SECRETARIES|SERVICES|CORP|COMPANY|TRUSTEES)\b/i;
function looksLikeCompany(name) {
  return CORP_NAME_RE.test(name || "");
}
function isHumanDirectorRole(role, name) {
  const r = (role || "").toLowerCase();
  if (r.includes("secretary")) return false;
  if (r.includes("corporate")) return false;
  const directorish = r.includes("director") || r.includes("member") || r.includes("partner");
  if (!directorish) return false;
  if (looksLikeCompany(name)) return false;
  return true;
}
const OVERLAP_GRACE_MS = 365 * 24 * 3600 * 1000;
function overlappedWindow(appointed, resigned, refDate) {
  if (!refDate) return true;
  const ref = new Date(refDate).getTime();
  if (isNaN(ref)) return true;
  if (appointed) {
    const a = new Date(appointed).getTime();
    if (!isNaN(a) && a > ref) return false;
  }
  if (resigned) {
    const res = new Date(resigned).getTime();
    if (!isNaN(res) && res < ref - OVERLAP_GRACE_MS) return false;
  }
  return true;
}

// ---------- risk (mirror of src/lib/phoenix/risk.ts) ----------
const ALL_FACTOR_KEYS = ["gap", "same_address", "same_sic", "co_director", "active_count"];
const YEAR_MS = 365.25 * 24 * 3600 * 1000;
const ONE_MONTH_MS = 30 * 24 * 3600 * 1000;
const parseD = (s) => {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};
const normAddr = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const isActive = (s) => (s || "").toLowerCase() === "active";

function scoreOfficer({ seedName, seedCollapseDate, seedAddress, seedSic, linked, coDirectorCompanies, seedStatus }) {
  const factors = [];
  const active = linked.filter((c) => isActive(c.status));
  const collapse = parseD(seedCollapseDate);

  const hasUnresolvedLinked = linked.some((c) => c.status === undefined);
  const seedHasAddr = !!normAddr(seedAddress);
  const seedHasSic = (seedSic || []).length > 0;
  const hadData = {
    gap: !!collapse && !hasUnresolvedLinked,
    same_address: seedHasAddr && !hasUnresolvedLinked,
    same_sic: seedHasSic && !hasUnresolvedLinked,
    co_director: coDirectorCompanies !== undefined,
    active_count: !hasUnresolvedLinked,
  };

  if (collapse) {
    const after = active
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

  let score = Math.min(100, factors.reduce((s, f) => s + f.points, 0));
  // A phoenix needs a dead firm — if the fined firm is still trading, the overlaps
  // are ordinary group structure. Cap so living groups can't top the league.
  if (isActive(seedStatus) && score > 35) {
    factors.push({
      key: "still_trading",
      label: "Fined firm is still trading — score capped",
      points: 0,
      detail: `${seedName} is still active at Companies House. Directors cannot have risen from a firm that never died, so the mechanical score is capped at 35 — read the overlaps above as group structure, not phoenixing.`,
    });
    score = 35;
  }
  const unknownFactors = ALL_FACTOR_KEYS.filter((k) => !hadData[k]);
  const dataCompleteness = (ALL_FACTOR_KEYS.length - unknownFactors.length) / ALL_FACTOR_KEYS.length;
  return { score, factors, dataCompleteness, unknownFactors };
}

// ---------- entity building (dedupe + merge repeat actions) ----------
function buildEntities(fines) {
  const skipped = [];
  const byKey = new Map();
  for (const row of fines) {
    const firm = String(row.firm || "").trim();
    if (!firm) {
      skipped.push({ firm: "(blank)", reason: "empty firm name" });
      continue;
    }
    if (looksLikeIndividual(firm)) {
      skipped.push({ firm, reason: "looks like a named individual, not a company" });
      continue;
    }
    if (looksLikeMultiFirm(firm)) {
      skipped.push({ firm, reason: "action bundles multiple firms" });
      continue;
    }
    const key = core(firm);
    if (!key) {
      skipped.push({ firm, reason: "unrecognisable firm name" });
      continue;
    }
    const event = {
      date: parseFineDate(row.date, row.year),
      amount: typeof row.amount === "number" ? row.amount : null,
      reason: row.reason || null,
      ...(row.noticeUrl ? { noticeUrl: row.noticeUrl } : {}), // noticeUrl optional
    };
    if (!byKey.has(key)) byKey.set(key, { firm, fineEvents: [] });
    byKey.get(key).fineEvents.push(event);
  }
  const entities = [];
  for (const ent of byKey.values()) {
    const dated = ent.fineEvents.filter((e) => e.date).sort((a, b) => a.date.localeCompare(b.date));
    const earliest = dated.length ? dated[0].date : null;
    const totalAmount = ent.fineEvents.reduce((s, e) => s + (e.amount || 0), 0);
    entities.push({
      firm: ent.firm,
      key: core(ent.firm),
      fineDate: earliest,
      amount: totalAmount,
      fineEvents: ent.fineEvents,
    });
  }
  return { entities, skipped };
}

// ---------- per-entity resolution ----------
const APPTS_PER_DIRECTOR = 40;
const PROFILE_BUDGET_PER_ENTITY = 30;

async function processEntity(entity) {
  const search = await chGet(`/search/companies?q=${encodeURIComponent(entity.firm)}&items_per_page=10`);
  const match = bestMatch(entity.firm, search?.items ?? []);
  if (!match) return { skipReason: "no confident Companies House match" };

  const companyNumber = match.company_number;
  const profile = await chGet(`/company/${companyNumber}`);
  if (!profile) return { skipReason: "matched company profile unavailable" };

  const seedAddress = flattenAddress(profile.registered_office_address);
  const seedSic = profile.sic_codes || [];
  const seedName = profile.company_name || match.title;
  const fineDate = entity.fineDate; // trouble window = earliest fine

  const officersBody = await chGet(`/company/${companyNumber}/officers?items_per_page=35`);
  const directors = (officersBody?.items ?? []).filter((o) => isHumanDirectorRole(o.officer_role, o.name));

  // gather each director's appointments first (for co-director overlap)
  const gathered = [];
  for (const d of directors) {
    const id = officerId(d);
    if (!id) continue;
    const apptsBody = await chGet(`/officers/${id}/appointments?items_per_page=50`);
    gathered.push({
      name: d.name,
      id,
      appointed_on: d.appointed_on,
      resigned_on: d.resigned_on,
      appts: (apptsBody?.items ?? []).slice(0, APPTS_PER_DIRECTOR),
    });
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
  let budget = PROFILE_BUDGET_PER_ENTITY;
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
    // risk attribution: only directors present during the fine window
    if (!overlappedWindow(g.appointed_on, g.resigned_on, fineDate)) continue;

    const linked = [];
    let coDirectorCompanies = 0;
    const seen = new Set();
    for (const a of g.appts) {
      const cn = a?.appointed_to?.company_number;
      if (!cn || cn === companyNumber || seen.has(cn)) continue;
      seen.add(cn);
      const shared = companyOfficers.get(cn);
      if (shared && shared.size > 1) coDirectorCompanies++;
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
        // status stays undefined → scoreOfficer marks affected factors unknown
        linked.push({ number: cn, name: a?.appointed_to?.company_name || cn, status: preStatus });
      }
    }

    const { score, factors, dataCompleteness, unknownFactors } = scoreOfficer({
      seedName,
      seedCollapseDate: fineDate,
      seedAddress,
      seedSic,
      linked,
      coDirectorCompanies,
      seedStatus: profile.company_status,
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
        dataCompleteness,
        unknownFactors,
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

  if (!keptDirectors.length) return { skipReason: null, result: null };
  return {
    skipReason: null,
    result: {
      firm: entity.firm,
      fineDate,
      amount: entity.amount,
      fineEvents: entity.fineEvents,
      companyNumber,
      matchedName: seedName,
      directors: keptDirectors,
    },
  };
}

// ---------- output state ----------
function loadState() {
  if (fs.existsSync(OUT_FILE)) {
    try {
      const j = JSON.parse(fs.readFileSync(OUT_FILE, "utf8"));
      return {
        results: Array.isArray(j.results) ? j.results : [],
        skipped: Array.isArray(j.skipped) ? j.skipped : [],
        processedFirms: Array.isArray(j.processedFirms) ? j.processedFirms : [],
      };
    } catch {
      /* corrupt/partial — start fresh */
    }
  }
  return { results: [], skipped: [], processedFirms: [] };
}
function save(state) {
  fs.writeFileSync(
    OUT_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        processedFirms: state.processedFirms,
        skipped: state.skipped,
        results: state.results,
      },
      null,
      2,
    ),
  );
}

// ---------- main ----------
async function main() {
  const fines = JSON.parse(fs.readFileSync(FINES_FILE, "utf8"));
  const { entities, skipped: inputSkips } = buildEntities(fines);
  const rows = LIMIT > 0 ? entities.slice(0, LIMIT) : entities;

  const state = loadState();
  const done = new Set(state.processedFirms);

  // seed input-hygiene skips (dedupe against what's already recorded)
  const recordedSkips = new Set(state.skipped.map((s) => `${s.firm}|${s.reason}`));
  for (const s of inputSkips) {
    const k = `${s.firm}|${s.reason}`;
    if (!recordedSkips.has(k)) {
      state.skipped.push(s);
      recordedSkips.add(k);
    }
  }

  console.log(
    `Sweep starting: ${fines.length} enforcement rows → ${entities.length} company entities ` +
      `(${inputSkips.length} rows skipped as individuals/multi-firm; ${done.size} entities already done)`,
  );

  let processed = 0;
  let noMatch = 0;

  for (const entity of rows) {
    if (done.has(entity.key)) continue;
    try {
      const out = await processEntity(entity);
      if (out.skipReason) {
        state.skipped.push({ firm: entity.firm, reason: out.skipReason });
        noMatch++;
      } else if (out.result) {
        state.results.push(out.result);
      }
    } catch (e) {
      console.log(`  ! ${entity.firm}: ${e.message}`);
      state.skipped.push({ firm: entity.firm, reason: `error: ${e.message}` });
    }
    done.add(entity.key);
    state.processedFirms.push(entity.key);
    processed++;

    if (processed % 10 === 0) {
      save(state);
      console.log(`  ...${processed} entities processed this run (${state.results.length} with hits, ${noMatch} unmatched)`);
    }
  }

  save(state);
  console.log(
    `Sweep done. ${processed} entities processed this run; ${state.results.length} firms with resurfaced directors; ${state.skipped.length} total skipped/unmatched recorded.`,
  );
  console.log(`Written: ${OUT_FILE}`);
}

main().catch((e) => {
  console.error("Sweep failed:", e);
  process.exit(1);
});
