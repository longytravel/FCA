// src/lib/phoenix/types.ts  (owner: C — everyone imports from here; FROZEN per build spec §Data contracts)

export type PNode = {
  id: string; // company number | officer id
  type: "company" | "officer";
  name: string;
  status?: string; // active | dissolved | liquidation ...
  incorporated_on?: string;
  dissolved_on?: string;
  tags: string[]; // phoenix-seed | fined-seed | linked
  address?: string;
  sic_codes?: string[];
  risk?: number; // 0-100, officers only
  riskFactors?: RiskFactor[];
  // Confidence signals (officers only) — additive, optional. Missing evidence must not
  // read as low risk: a low `risk` with low `dataCompleteness` means "unknown", not "clean".
  dataCompleteness?: number; // 0-1: fraction of the 5 risk factors we had data to evaluate
  unknownFactors?: RiskFactor["key"][]; // factor keys that could not be evaluated
};

export type PEdge = {
  source: string;
  target: string;
  role: string;
  appointed_on?: string;
  resigned_on?: string;
};

export type PhoenixGraph = { nodes: PNode[]; edges: PEdge[] };

export type RiskFactor = {
  key: "gap" | "same_address" | "same_sic" | "co_director" | "active_count" | "still_trading";
  label: string;
  points: number;
  detail: string;
};
