"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import fines from "@/data/fines.json";
import { FCA } from "./graph-utils";

type SweepDirector = {
  name: string;
  officerId: string;
  risk: number;
  activeCompanies?: { number: string; name: string; incorporated_on?: string; status?: string }[];
};
type SweepRow = {
  firm: string;
  fineDate?: string;
  amount?: number;
  companyNumber?: string;
  matchedName?: string;
  directors?: SweepDirector[];
};
type SweepPayload = { generatedAt?: string; results?: SweepRow[] };

type SortKey = "amount" | "risk" | "active" | "firm";

const gbp = (n?: number) =>
  typeof n === "number"
    ? new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n)
    : "—";

function topRisk(r: SweepRow): number {
  return (r.directors ?? []).reduce((m, d) => Math.max(m, d.risk ?? 0), 0);
}
function activeCount(r: SweepRow): number {
  return (r.directors ?? []).reduce((s, d) => s + (d.activeCompanies?.length ?? 0), 0);
}

const finesByYear = (() => {
  const map = new Map<number, number>();
  for (const f of fines as { year: number; amount: number }[]) {
    map.set(f.year, (map.get(f.year) ?? 0) + (f.amount ?? 0));
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([year, total]) => ({ year, total: Math.round(total / 1_000_000) }));
})();

export default function SweepTable({
  onLoadFirm,
}: {
  onLoadFirm: (companyNumber: string, name: string) => void;
}) {
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [payload, setPayload] = useState<SweepPayload | null>(null);
  const [message, setMessage] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("risk");
  const [dir, setDir] = useState<1 | -1>(-1);

  const load = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/phoenix/sweep");
      if (res.status === 404) {
        const body = await res.json().catch(() => ({}));
        setMessage(body?.message || "The overnight sweep has not been generated yet.");
        setState("missing");
        return;
      }
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = (await res.json()) as SweepPayload;
      setPayload(data);
      setState("ready");
    } catch (e) {
      setMessage((e as Error).message);
      setState("error");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    const r = [...(payload?.results ?? [])];
    r.sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      if (sort === "amount") [av, bv] = [a.amount ?? 0, b.amount ?? 0];
      else if (sort === "risk") [av, bv] = [topRisk(a), topRisk(b)];
      else if (sort === "active") [av, bv] = [activeCount(a), activeCount(b)];
      else [av, bv] = [a.firm, b.firm];
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return r;
  }, [payload, sort, dir]);

  const setSortKey = (k: SortKey) => {
    if (k === sort) setDir((d) => (d === 1 ? -1 : 1));
    else {
      setSort(k);
      setDir(k === "firm" ? 1 : -1);
    }
  };

  const arrow = (k: SortKey) => (sort === k ? (dir === 1 ? " ▲" : " ▼") : "");

  return (
    <section className="border border-[#d2d2d4] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d2d2d4] bg-[#6c1d45] px-4 py-2">
        <div>
          <h3 className="text-sm font-bold text-white">The sweep — every fined firm, rechecked</h3>
          <p className="text-[12px] text-white/75">
            Directors of fined firms now running active companies. Click a row to load that firm
            into the map.
          </p>
        </div>
        {state === "ready" && payload?.generatedAt ? (
          <span className="text-[11px] text-white/75">
            Swept {new Date(payload.generatedAt).toLocaleDateString("en-GB")}
          </span>
        ) : null}
      </div>

      {/* fines-by-year context chart (always available) */}
      <div className="border-b border-[#d2d2d4] px-4 py-2">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[#75767a]">
          FCA fines by year (£m) — 300-firm base set
        </p>
        <div className="h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={finesByYear} margin={{ top: 2, right: 4, bottom: 0, left: -18 }}>
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: FCA.muted }} interval={2} tickLine={false} axisLine={{ stroke: FCA.rule }} />
              <YAxis tick={{ fontSize: 10, fill: FCA.muted }} tickLine={false} axisLine={false} width={34} />
              <Tooltip
                cursor={{ fill: "#f0f0f1" }}
                contentStyle={{ fontSize: 12, border: `1px solid ${FCA.rule}`, borderRadius: 0 }}
                formatter={((v: number) => [`£${v}m`, "Fines"]) as never}
              />
              <Bar dataKey="total" fill={FCA.mulberry} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {state === "loading" ? (
        <p className="px-4 py-6 text-[13px] text-[#75767a]">Loading sweep results…</p>
      ) : state === "missing" ? (
        <div className="px-4 py-6">
          <p className="text-[13px] text-[#3f3f3f]">
            The full sweep is running now — every fined firm is being rechecked against Companies
            House. Results appear here automatically once it completes.
          </p>
          <button
            onClick={load}
            className="mt-2 border border-[#6c1d45] bg-white px-3 py-1 text-[12px] font-bold text-[#6c1d45] hover:bg-[#6c1d45] hover:text-white"
          >
            Retry
          </button>
        </div>
      ) : state === "error" ? (
        <div className="px-4 py-6">
          <p className="text-[13px] text-[#ff585d]">Could not load sweep: {message}</p>
          <button
            onClick={load}
            className="mt-2 border border-[#6c1d45] bg-white px-3 py-1 text-[12px] font-bold text-[#6c1d45] hover:bg-[#6c1d45] hover:text-white"
          >
            Retry
          </button>
        </div>
      ) : rows.length === 0 ? (
        <p className="px-4 py-6 text-[13px] text-[#75767a]">No resurfaced directors in the sweep output.</p>
      ) : (
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead className="sticky top-0 bg-[#f0f0f1]">
              <tr className="text-left">
                {([
                  ["firm", "Fined firm"],
                  ["amount", "Fine"],
                  ["risk", "Top risk"],
                  ["active", "Active cos"],
                ] as [SortKey, string][]).map(([k, label]) => (
                  <th key={k} className="border-b border-[#d2d2d4] px-3 py-2">
                    <button onClick={() => setSortKey(k)} className="font-bold text-[#6c1d45] hover:underline">
                      {label}
                      {arrow(k)}
                    </button>
                  </th>
                ))}
                <th className="border-b border-[#d2d2d4] px-3 py-2 font-bold text-[#6c1d45]">Director</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const risk = topRisk(r);
                const lead = (r.directors ?? []).slice().sort((a, b) => (b.risk ?? 0) - (a.risk ?? 0))[0];
                return (
                  <tr
                    key={(r.companyNumber ?? r.firm) + i}
                    onClick={() =>
                      r.companyNumber && onLoadFirm(r.companyNumber, r.matchedName || r.firm)
                    }
                    className={`border-b border-[#eeeeef] ${
                      r.companyNumber ? "cursor-pointer hover:bg-[#f0f0f1]" : "opacity-70"
                    }`}
                    title={r.companyNumber ? "Load into the network" : "No matched company"}
                  >
                    <td className="px-3 py-2 font-medium text-[#3f3f3f]">
                      {r.firm}
                      {r.fineDate ? (
                        <span className="block text-[11px] text-[#75767a]">{r.fineDate}</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-[#3f3f3f]">{gbp(r.amount)}</td>
                    <td className="px-3 py-2">
                      <span
                        className="inline-block min-w-[34px] px-2 py-[1px] text-center text-[12px] font-bold text-white"
                        style={{ background: risk >= 60 ? FCA.coral : risk >= 30 ? FCA.mulberry : FCA.muted }}
                      >
                        {risk}
                      </span>
                    </td>
                    <td className="px-3 py-2 tabular-nums text-[#3f3f3f]">{activeCount(r)}</td>
                    <td className="px-3 py-2 text-[#3f3f3f]">
                      {lead ? lead.name : <span className="text-[#75767a]">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
