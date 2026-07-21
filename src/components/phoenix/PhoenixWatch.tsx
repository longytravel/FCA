"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { PhoenixGraph, PNode, PEdge } from "@/src/lib/phoenix/types";
import fines from "@/data/fines.json";
import {
  CASES,
  computeAppearance,
  emptyGraph,
  mergeGraph,
  parseDate,
} from "./graph-utils";
import GraphStage from "./GraphStage";
import NodeDetailPanel from "./NodeDetailPanel";
import TimelineScrubber, { type FineMark } from "./TimelineScrubber";
import SearchBar from "./SearchBar";
import BriefingPanel from "./BriefingPanel";
import ChatDock from "./ChatDock";
import SweepTable from "./SweepTable";
import DossierModal from "./DossierModal";

export default function PhoenixWatch() {
  const searchParams = useSearchParams();
  const [graph, setGraph] = useState<PhoenixGraph>(emptyGraph);
  const [fixtureState, setFixtureState] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [selectedNode, setSelectedNode] = useState<PNode | null>(null);
  const [focusFirm, setFocusFirm] = useState<{ id: string; name: string } | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [focusNonce, setFocusNonce] = useState(0);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [dossierNode, setDossierNode] = useState<PNode | null>(null);
  const [present, setPresent] = useState(false);

  // timeline
  const [tlActive, setTlActive] = useState(false);
  const [tlValue, setTlValue] = useState(0);
  const [tlPlaying, setTlPlaying] = useState(false);

  const resolveAbort = useRef<AbortController | null>(null);

  // init presenter mode from query once
  useEffect(() => {
    if (searchParams.get("present") === "1") setPresent(true);
  }, [searchParams]);

  // load instant-paint fixture (agent C copies it to public/phoenix-graph.json)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/phoenix-graph.json", { cache: "force-cache" });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (cancelled) return;
        const g: PhoenixGraph = { nodes: data.nodes ?? [], edges: data.edges ?? [] };
        setGraph(g);
        setFixtureState(g.nodes.length ? "ready" : "empty");
      } catch {
        if (!cancelled) setFixtureState("empty");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { min: tlMin, max: tlMax } = useMemo(() => computeAppearance(graph), [graph]);
  useEffect(() => {
    setTlValue((v) => (v === 0 ? tlMax : v));
  }, [tlMax]);

  const fineMarks: FineMark[] = useMemo(() => {
    const names = graph.nodes.map((n) => n.name.toUpperCase());
    const marks: FineMark[] = [];
    for (const f of fines as { firm: string; date: string; amount: number }[]) {
      const u = f.firm.toUpperCase();
      const hit = names.some((n) => n.includes(u) || u.includes(n));
      if (!hit) continue;
      const ms = parseDate(f.date);
      if (ms == null) continue;
      marks.push({ ms, label: `${f.firm} fined ${f.date}` });
      if (marks.length >= 14) break;
    }
    return marks;
  }, [graph]);

  const resolveFirm = useCallback(
    async (companyNumber: string, name: string) => {
      resolveAbort.current?.abort();
      const ac = new AbortController();
      resolveAbort.current = ac;
      setResolving(true);
      setResolveError(null);
      setFocusFirm({ id: companyNumber, name });
      try {
        const res = await fetch(`/api/phoenix/resolve?company=${encodeURIComponent(companyNumber)}`, {
          signal: ac.signal,
        });
        if (!res.ok) throw new Error(`Resolve failed (${res.status})`);
        const data = await res.json();
        const incoming: PhoenixGraph = data.graph ?? { nodes: [], edges: [] };
        setGraph((g) => mergeGraph(g, incoming));
      } catch (e) {
        if ((e as Error).name !== "AbortError") setResolveError((e as Error).message);
      } finally {
        setResolving(false);
        setFocusId(companyNumber);
        setFocusNonce((n) => n + 1);
      }
    },
    [],
  );

  const onNodeClick = useCallback((node: PNode) => {
    setSelectedNode(node);
    setFocusId(node.id);
    setFocusNonce((n) => n + 1);
  }, []);

  const onGraphMerge = useCallback((nodes: PNode[], edges: PEdge[]) => {
    setGraph((g) => mergeGraph(g, { nodes, edges }));
  }, []);

  // presenter keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      if (e.key === "Escape") {
        if (dossierNode) return; // dossier handles its own Esc
        if (present) setPresent(false);
        return;
      }
      if (!present) return;
      if (e.key === "1" || e.key === "2" || e.key === "3") {
        const c = CASES[Number(e.key) - 1];
        if (c) resolveFirm(c.number, c.name);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [present, dossierNode, resolveFirm]);

  const timelineDate = tlActive ? tlValue : null;

  const togglePlay = () => {
    setTlPlaying((p) => {
      if (!p && tlValue >= tlMax) setTlValue(tlMin);
      return !p;
    });
  };
  const toggleActive = (a: boolean) => {
    setTlActive(a);
    setTlPlaying(false);
    if (a) setTlValue(tlMin);
    else setTlValue(tlMax);
  };

  const resolveBanner =
    resolving || resolveError ? (
      <div
        className={`absolute left-2 top-2 z-20 max-w-[80%] border px-3 py-1 text-[12px] ${
          resolveError ? "border-[#ff585d] bg-white text-[#ff585d]" : "border-[#d2d2d4] bg-white text-[#3f3f3f]"
        }`}
      >
        {resolving
          ? `Resolving ${focusFirm?.name ?? "firm"} from Companies House…`
          : `Could not resolve: ${resolveError}`}
      </div>
    ) : null;

  // ---- Presenter mode ----
  if (present) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
        <div className="flex items-center justify-between border-b border-[#d2d2d4] bg-[#6c1d45] px-4 py-2 text-white">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold">FCA Phoenix Watch — presenter</span>
            <span className="hidden text-[12px] opacity-80 sm:inline">Press 1 / 2 / 3 for cases · Esc to exit</span>
          </div>
          <div className="flex items-center gap-2">
            {CASES.map((c, i) => (
              <button
                key={c.number}
                onClick={() => resolveFirm(c.number, c.name)}
                className="border border-white/50 bg-white/10 px-2 py-1 text-[12px] font-bold hover:bg-white/20"
              >
                {i + 1}. {c.name.split(" ")[0]}
              </button>
            ))}
            <button
              onClick={() => setPresent(false)}
              className="border border-white/50 bg-white/10 px-2 py-1 text-[12px] font-bold hover:bg-white/20"
            >
              Exit
            </button>
          </div>
        </div>
        <div className="relative flex-1">
          {resolveBanner}
          <GraphStage
            graph={graph}
            timelineDate={timelineDate}
            selectedId={selectedNode?.id}
            focusId={focusId}
            focusNonce={focusNonce}
            present
            onNodeClick={onNodeClick}
          />
          {selectedNode ? (
            <div className="absolute right-3 top-3 z-20 max-h-[80%] w-[340px] overflow-hidden border border-[#d2d2d4] bg-white shadow-lg">
              <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} onDossier={setDossierNode} />
            </div>
          ) : null}
        </div>
        <TimelineScrubber
          min={tlMin}
          max={tlMax}
          value={tlValue}
          active={tlActive}
          playing={tlPlaying}
          fineMarks={fineMarks}
          onChange={setTlValue}
          onTogglePlay={togglePlay}
          onToggleActive={toggleActive}
        />
        <DossierModal graph={graph} node={dossierNode} onClose={() => setDossierNode(null)} />
      </div>
    );
  }

  // ---- Standard page ----
  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif" }} className="text-[#3f3f3f]">
      {/* Hero */}
      <section className="border-b border-[#d2d2d4] bg-[#f0f0f1]">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#6c1d45]">Phoenix Watch</h1>
              <p className="mt-1 max-w-2xl text-[14px] text-[#3f3f3f]">
                Trace directors of failed and fined firms into the active companies they rose again
                behind — live Companies House data, transparent risk scoring, and Claude briefings.
              </p>
            </div>
            <button
              onClick={() => setPresent(true)}
              className="border border-[#6c1d45] bg-white px-3 py-2 text-[13px] font-bold text-[#6c1d45] hover:bg-[#6c1d45] hover:text-white"
            >
              ▶ Presenter mode
            </button>
          </div>
          <div className="mt-4 max-w-2xl">
            <SearchBar onSelect={resolveFirm} busy={resolving} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-5">
        {fixtureState === "empty" ? (
          <p className="mb-3 border border-[#d2d2d4] bg-white px-3 py-2 text-[13px] text-[#75767a]">
            Instant-paint fixture not found — search a firm above or pick a case to build the network
            live from Companies House.
          </p>
        ) : null}

        {/* Graph + detail */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col border border-[#d2d2d4] bg-white">
            <div className="flex items-center justify-between border-b border-[#d2d2d4] bg-[#f0f0f1] px-4 py-2">
              <h2 className="text-sm font-bold text-[#6c1d45]">Network</h2>
              <Legend />
            </div>
            <div className="relative h-[540px]">
              {resolveBanner}
              {fixtureState === "loading" ? (
                <div className="flex h-full items-center justify-center text-[13px] text-[#75767a]">
                  Loading network…
                </div>
              ) : (
                <GraphStage
                  graph={graph}
                  timelineDate={timelineDate}
                  selectedId={selectedNode?.id}
                  focusId={focusId}
                  focusNonce={focusNonce}
                  onNodeClick={onNodeClick}
                />
              )}
            </div>
            <TimelineScrubber
              min={tlMin}
              max={tlMax}
              value={tlValue}
              active={tlActive}
              playing={tlPlaying}
              fineMarks={fineMarks}
              onChange={setTlValue}
              onTogglePlay={togglePlay}
              onToggleActive={toggleActive}
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="h-[360px] border border-[#d2d2d4] bg-white">
              <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} onDossier={setDossierNode} />
            </div>
            <BriefingPanel graph={graph} focusId={focusFirm?.id ?? null} focusName={focusFirm?.name ?? null} />
          </div>
        </div>

        {/* Chat + sweep */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="h-[460px]">
            <ChatDock graph={graph} onGraphMerge={onGraphMerge} />
          </div>
          <SweepTable onLoadFirm={resolveFirm} />
        </div>
      </div>

      <DossierModal graph={graph} node={dossierNode} onClose={() => setDossierNode(null)} />
    </div>
  );
}

function Legend() {
  const items: [string, string, "sq" | "ci"][] = [
    ["#6c1d45", "Company", "sq"],
    ["#ff585d", "Phoenix signal", "sq"],
    ["#75767a", "Dissolved", "sq"],
    ["#003c71", "Officer", "ci"],
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#75767a]">
      {items.map(([c, label, shape]) => (
        <span key={label} className="flex items-center gap-1">
          <span
            className={shape === "ci" ? "inline-block h-[10px] w-[10px] rounded-full" : "inline-block h-[10px] w-[10px]"}
            style={{ background: c }}
          />
          {label}
        </span>
      ))}
    </div>
  );
}
