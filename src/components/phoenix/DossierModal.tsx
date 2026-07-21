"use client";

import { useEffect, useRef, useState } from "react";
import type { PhoenixGraph, PNode } from "@/src/lib/phoenix/types";
import { streamText } from "./stream";
import { mdToHtml } from "./md";
import fines from "@/data/fines.json";

export default function DossierModal({
  graph,
  node,
  onClose,
}: {
  graph: PhoenixGraph;
  node: PNode | null;
  onClose: () => void;
}) {
  const [md, setMd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!node) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setMd("");
    setError(null);
    setLoading(true);

    // Pass any fines whose firm name overlaps a graph node, to ground the chronology.
    const names = new Set(graph.nodes.map((n) => n.name.toUpperCase()));
    const relevantFines = (fines as { firm: string }[])
      .filter((f) => {
        const u = f.firm.toUpperCase();
        for (const n of names) if (n.includes(u) || u.includes(n)) return true;
        return false;
      })
      .slice(0, 12);

    streamText(
      "/api/ai/dossier",
      { graph, focusId: node.id, fines: relevantFines },
      (full) => setMd(full),
      ac.signal,
    )
      .catch((e) => {
        if ((e as Error).name !== "AbortError") setError((e as Error).message);
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node?.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!node) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/40 p-4 print:static print:block print:bg-white print:p-0"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dossier-sheet my-6 w-full max-w-3xl border border-[#d2d2d4] bg-white shadow-lg print:my-0 print:max-w-none print:border-0 print:shadow-none">
        <div className="flex items-center justify-between border-b border-[#d2d2d4] bg-[#6c1d45] px-5 py-3 text-white print:bg-white print:text-black">
          <div>
            <p className="text-[11px] uppercase tracking-widest opacity-80 print:opacity-100">
              FCA Phoenix Watch — supervisory dossier
            </p>
            <h2 className="text-lg font-bold">{node.name}</h2>
          </div>
          <div className="flex gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="border border-white/60 bg-white/10 px-3 py-1 text-[13px] font-bold hover:bg-white/20"
            >
              Print / PDF
            </button>
            <button
              onClick={onClose}
              className="border border-white/60 bg-white/10 px-3 py-1 text-[13px] font-bold hover:bg-white/20"
            >
              Close
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          {error ? (
            <p className="text-[14px] text-[#ff585d]">
              Dossier generation failed: {error}. The AI service may be busy — close and retry.
            </p>
          ) : md ? (
            <div className="dossier-body" dangerouslySetInnerHTML={{ __html: mdToHtml(md) }} />
          ) : (
            <p className="text-[14px] text-[#75767a]">Claude is drafting the dossier from the live network…</p>
          )}
          {loading && md ? (
            <span className="ml-[1px] inline-block h-4 w-[2px] animate-pulse bg-[#6c1d45] align-middle print:hidden" />
          ) : null}
        </div>
      </div>

      <style>{`
        .dossier-body { color: #3f3f3f; font-size: 14px; line-height: 1.6; }
        .dossier-body h1 { color: #6c1d45; font-size: 22px; font-weight: 700; margin: 0 0 8px; }
        .dossier-body h2 { color: #6c1d45; font-size: 17px; font-weight: 700; margin: 18px 0 6px; border-bottom: 1px solid #d2d2d4; padding-bottom: 3px; }
        .dossier-body h3 { color: #003c71; font-size: 14px; font-weight: 700; margin: 14px 0 4px; }
        .dossier-body p { margin: 0 0 8px; }
        .dossier-body ul, .dossier-body ol { margin: 0 0 10px 20px; }
        .dossier-body li { margin: 2px 0; }
        .dossier-body a { color: #6c1d45; }
        .dossier-body code { background: #f0f0f1; padding: 0 3px; font-size: 13px; }
        .dossier-body blockquote { border-left: 3px solid #6c1d45; margin: 0 0 10px; padding: 2px 10px; color: #75767a; }
        .dossier-body hr { border: 0; border-top: 1px solid #d2d2d4; margin: 14px 0; }
        .dossier-body table { border-collapse: collapse; width: 100%; margin: 8px 0 12px; font-size: 13px; }
        .dossier-body th, .dossier-body td { border: 1px solid #d2d2d4; padding: 5px 8px; text-align: left; vertical-align: top; }
        .dossier-body th { background: #f0f0f1; color: #6c1d45; font-weight: 700; }
        @media print {
          @page { margin: 18mm; }
          body { background: #fff !important; }
          .dossier-sheet { max-width: none !important; }
        }
      `}</style>
    </div>
  );
}
