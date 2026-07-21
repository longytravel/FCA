"use client";

import type { PNode } from "@/src/lib/phoenix/types";
import { FCA, fmtDate, isDissolvedStatus, isPhoenixSignal } from "./graph-utils";

function StatusPill({ node }: { node: PNode }) {
  let label = "Company";
  let bg: string = FCA.mulberry;
  if (node.type === "officer") {
    label = "Officer";
    bg = FCA.navy;
  } else if (node.tags?.includes("phoenix-seed")) {
    label = "Phoenix seed";
    bg = FCA.mulberry;
  } else if (node.tags?.includes("fined-seed")) {
    label = "Fined firm";
    bg = FCA.darkteal;
  } else if (isPhoenixSignal(node)) {
    label = "Phoenix signal";
    bg = FCA.coral;
  } else if (isDissolvedStatus(node.status)) {
    label = "Dissolved / insolvent";
    bg = FCA.muted;
  }
  return (
    <span className="inline-block px-2 py-[2px] text-[11px] font-bold uppercase tracking-wide text-white" style={{ background: bg }}>
      {label}
    </span>
  );
}

function RiskBars({ node }: { node: PNode }) {
  const factors = node.riskFactors ?? [];
  if (node.type !== "officer") return null;
  const risk = typeof node.risk === "number" ? node.risk : null;
  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between border-b border-[#d2d2d4] pb-1">
        <h4 className="text-sm font-bold text-[#3f3f3f]">
          Phoenix risk score
          <span className="block text-[11px] font-normal text-[#75767a]">
            0–100 &ldquo;look here first&rdquo; indicator — every point explained below
          </span>
        </h4>
        <span className="text-lg font-bold" style={{ color: risk != null && risk >= 60 ? FCA.coral : FCA.mulberry }}>
          {risk != null ? `${risk}/100` : "—"}
        </span>
      </div>
      {factors.length === 0 ? (
        <p className="mt-2 text-[13px] text-[#75767a]">
          No scored risk factors yet. Resolve this firm to compute the breakdown from live
          Companies House data.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {factors.map((f, idx) => {
            const max = f.key === "gap" ? 30 : f.key === "same_address" ? 25 : 15;
            const pct = Math.min(100, (f.points / max) * 100);
            return (
              <li key={f.key + idx}>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-medium text-[#3f3f3f]">{f.label}</span>
                  <span className="tabular-nums text-[#75767a]">+{f.points}</span>
                </div>
                <div className="mt-1 h-2 w-full bg-[#e4e4e6]">
                  <div className="h-2" style={{ width: `${pct}%`, background: FCA.mulberry }} />
                </div>
                {f.detail ? <p className="mt-1 text-[12px] leading-snug text-[#75767a]">{f.detail}</p> : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function NodeDetailPanel({
  node,
  onClose,
  onDossier,
}: {
  node: PNode | null;
  onClose: () => void;
  onDossier: (node: PNode) => void;
}) {
  if (!node) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-[13px] text-[#75767a]">
        Click any company or officer in the network to inspect its Companies House record and
        risk working.
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between border-b border-[#d2d2d4] bg-[#f0f0f1] px-4 py-3">
        <div className="pr-2">
          <StatusPill node={node} />
          <h3 className="mt-2 text-base font-bold leading-tight text-[#6c1d45]">{node.name}</h3>
          <p className="text-[12px] text-[#75767a]">
            {node.type === "company" ? `Company no. ${node.id}` : `Officer ${node.id.slice(0, 10)}…`}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close detail panel"
          className="shrink-0 border border-[#d2d2d4] bg-white px-2 py-1 text-[13px] text-[#6c1d45] hover:bg-[#f0f0f1] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6c1d45]"
        >
          Close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1 text-[13px]">
          {node.status ? (
            <>
              <dt className="text-[#75767a]">Status</dt>
              <dd className="font-medium text-[#3f3f3f]">{node.status}</dd>
            </>
          ) : null}
          {node.incorporated_on ? (
            <>
              <dt className="text-[#75767a]">Incorporated</dt>
              <dd className="text-[#3f3f3f]">{fmtDate(node.incorporated_on)}</dd>
            </>
          ) : null}
          {node.dissolved_on ? (
            <>
              <dt className="text-[#75767a]">Dissolved</dt>
              <dd className="text-[#3f3f3f]">{fmtDate(node.dissolved_on)}</dd>
            </>
          ) : null}
          {node.address ? (
            <>
              <dt className="text-[#75767a]">Address</dt>
              <dd className="text-[#3f3f3f]">{node.address}</dd>
            </>
          ) : null}
          {node.sic_codes?.length ? (
            <>
              <dt className="text-[#75767a]">SIC</dt>
              <dd className="text-[#3f3f3f]">{node.sic_codes.join(", ")}</dd>
            </>
          ) : null}
          {node.tags?.length ? (
            <>
              <dt className="text-[#75767a]">Tags</dt>
              <dd className="text-[#3f3f3f]">{node.tags.join(", ")}</dd>
            </>
          ) : null}
        </dl>

        <RiskBars node={node} />
      </div>

      <div className="border-t border-[#d2d2d4] p-3">
        <button
          onClick={() => onDossier(node)}
          className="w-full bg-[#6c1d45] px-3 py-2 text-sm font-bold text-white hover:bg-[#571639] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#6c1d45]"
        >
          Generate supervisory dossier
        </button>
        <a
          href={
            node.type === "company"
              ? `https://find-and-update.company-information.service.gov.uk/company/${node.id}`
              : `https://find-and-update.company-information.service.gov.uk/officers/${node.id}/appointments`
          }
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block text-center text-[12px] text-[#6c1d45] underline-offset-2 hover:underline"
        >
          View source record on Companies House ↗
        </a>
      </div>
    </div>
  );
}
