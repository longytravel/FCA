// src/lib/phoenix/risk.ts  (owner: C)
// Transparent, per-officer phoenix risk scoring. Every point is explained by a
// RiskFactor with a human-readable detail string — the UI shows the working.
//
// Scoring bands (build spec §Risk score, total capped at 100):
//   gap           — new company incorporated ≤2y after the collapsed firm's fine/dissolution   (up to 30)
//   same_address  — an active linked company shares the collapsed firm's registered address     (25)
//   same_sic      — an active linked company shares a SIC code with the collapsed firm           (15)
//   co_director   — a linked company shares another director with the collapsed firm             (15)
//   active_count  — number of active companies linked to this director                           (up to 15)

import type { RiskFactor } from "./types";

const ALL_FACTOR_KEYS: RiskFactor["key"][] = ["gap", "same_address", "same_sic", "co_director", "active_count"];

export type LinkedCo = {
  number: string;
  name: string;
  status?: string;
  incorporated_on?: string;
  address?: string;
  sic_codes?: string[];
};

export type RiskInput = {
  seedName: string;
  /** ISO date the collapsed firm's trouble started: dissolution, fine date, or (fallback) incorporation. */
  seedCollapseDate?: string;
  seedAddress?: string;
  seedSic?: string[];
  /** Companies this officer is/was appointed to (excluding the seed), with resolved profile fields. */
  linked: LinkedCo[];
  /** Count of this officer's linked companies that also share another director with the seed. */
  coDirectorCompanies?: number;
  /** Companies House status of the fined/seed firm itself. */
  seedStatus?: string;
};

export type RiskResult = {
  score: number;
  factors: RiskFactor[];
  /** Fraction (0-1) of the 5 factors we had enough data to evaluate (score or clear-negative). */
  dataCompleteness: number;
  /** Factor keys we could not evaluate — usually because linked-company profiles were unavailable. */
  unknownFactors: RiskFactor["key"][];
};

const YEAR_MS = 365.25 * 24 * 3600 * 1000;
const ONE_MONTH_MS = 30 * 24 * 3600 * 1000;

function parseDate(s?: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function normAddress(s?: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isActive(status?: string): boolean {
  return (status || "").toLowerCase() === "active";
}

export function scoreOfficer(input: RiskInput): RiskResult {
  const factors: RiskFactor[] = [];
  const active = input.linked.filter((c) => isActive(c.status));
  const collapse = parseDate(input.seedCollapseDate);

  // Evaluability: a factor "has data" when we had the seed-side input AND no linked company
  // was left unresolved (unknown status) — an unresolved linked company could hide a positive,
  // so we mark the comparison factors unknown rather than silently scoring them zero.
  const hasUnresolvedLinked = input.linked.some((c) => c.status === undefined);
  const seedHasAddr = !!normAddress(input.seedAddress);
  const seedHasSic = (input.seedSic || []).length > 0;
  const haveCollapse = !!collapse;
  const hadData: Partial<Record<RiskFactor["key"], boolean>> = {
    gap: haveCollapse && !hasUnresolvedLinked,
    same_address: seedHasAddr && !hasUnresolvedLinked,
    same_sic: seedHasSic && !hasUnresolvedLinked,
    co_director: input.coDirectorCompanies !== undefined,
    active_count: !hasUnresolvedLinked,
  };

  // 1. gap — nearest active company incorporated on/after the collapse, within 2 years
  if (collapse) {
    const after = active
      .map((c) => ({ c, inc: parseDate(c.incorporated_on) }))
      .filter((x): x is { c: LinkedCo; inc: Date } => !!x.inc && x.inc.getTime() >= collapse.getTime() - ONE_MONTH_MS)
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
          detail: `${nearest.c.name} (${nearest.c.number}) was incorporated ${nearest.c.incorporated_on}, ${gapMonths} month${gapMonths === 1 ? "" : "s"} after ${input.seedName}'s collapse (${input.seedCollapseDate}).`,
        });
      }
    }
  }

  // 2. same_address — active linked company at the seed's registered address
  const seedAddr = normAddress(input.seedAddress);
  if (seedAddr) {
    const match = active.find((c) => normAddress(c.address) && normAddress(c.address) === seedAddr);
    if (match) {
      factors.push({
        key: "same_address",
        label: "Shares registered address with collapsed firm",
        points: 25,
        detail: `${match.name} (${match.number}) is registered at the same address as ${input.seedName}: ${match.address}.`,
      });
    }
  }

  // 3. same_sic — active linked company shares a SIC code with the seed
  const seedSic = new Set((input.seedSic || []).map(String));
  if (seedSic.size) {
    const match = active.find((c) => (c.sic_codes || []).some((s) => seedSic.has(String(s))));
    if (match) {
      const shared = (match.sic_codes || []).filter((s) => seedSic.has(String(s)));
      factors.push({
        key: "same_sic",
        label: "Same industry classification (SIC)",
        points: 15,
        detail: `${match.name} (${match.number}) shares SIC code${shared.length > 1 ? "s" : ""} ${shared.join(", ")} with ${input.seedName}.`,
      });
    }
  }

  // 4. co_director — a linked company shares another director with the seed
  const coDir = input.coDirectorCompanies ?? 0;
  if (coDir > 0) {
    factors.push({
      key: "co_director",
      label: "Co-director overlap with collapsed firm",
      points: 15,
      detail: `${coDir} linked compan${coDir === 1 ? "y also shares" : "ies also share"} another ${input.seedName} director.`,
    });
  }

  // 5. active_count — how many active companies this director still runs
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

  // A phoenix needs a dead firm. If the fined firm is still trading, shared
  // addresses/SICs/directors are ordinary group structure, not resurrection —
  // cap the score so living corporate groups can't top the league.
  if (isActive(input.seedStatus) && score > 35) {
    factors.push({
      key: "still_trading",
      label: "Fined firm is still trading — score capped",
      points: 0,
      detail: `${input.seedName} is still active at Companies House. Directors cannot have risen from a firm that never died, so the mechanical score is capped at 35 — read the overlaps above as group structure, not phoenixing.`,
    });
    score = 35;
  }

  const unknownFactors = ALL_FACTOR_KEYS.filter((k) => !hadData[k]);
  const dataCompleteness = (ALL_FACTOR_KEYS.length - unknownFactors.length) / ALL_FACTOR_KEYS.length;
  return { score, factors, dataCompleteness, unknownFactors };
}
