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

  // Only the chosen firm's connected network is displayed — other cases' clusters
  // stay hidden so the map reads as one story.
  const displayedGraph = useMemo(() => {
    if (!focusFirm) return emptyGraph();
    const keep = new Set<string>([focusFirm.id]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const e of graph.edges) {
        const s = keep.has(e.source);
        const t = keep.has(e.target);
        if (s !== t) {
          keep.add(e.source);
          keep.add(e.target);
          grew = true;
        }
      }
    }
    return {
      nodes: graph.nodes.filter((n) => keep.has(n.id)),
      edges: graph.edges.filter((e) => keep.has(e.source) && keep.has(e.target)),
    };
  }, [graph, focusFirm]);

  // Don't brief until the firm's records are actually in the graph — briefing on a
  // stale graph produces "we hold no records" while the resolve is still running.
  const briefingFocusId =
    !resolving && focusFirm && graph.nodes.some((n) => n.id === focusFirm.id)
      ? focusFirm.id
      : null;

  const { min: tlMin, max: tlMax } = useMemo(() => computeAppearance(displayedGraph), [displayedGraph]);
  useEffect(() => {
    setTlValue((v) => (v === 0 ? tlMax : v));
  }, [tlMax]);

  const fineMarks: FineMark[] = useMemo(() => {
    const names = displayedGraph.nodes.map((n) => n.name.toUpperCase());
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
  }, [displayedGraph]);

  // Headline stats for the focused case — the one-line story above the graph.
  const caseStats = useMemo(() => {
    const id = focusFirm?.id;
    if (!id) return null;
    const officerIds = new Set<string>();
    for (const e of graph.edges) {
      if (e.source === id) officerIds.add(e.target);
      if (e.target === id) officerIds.add(e.source);
    }
    const officers = graph.nodes.filter((n) => n.type === "officer" && officerIds.has(n.id));
    const linked = new Set<string>();
    for (const e of graph.edges) {
      if (officerIds.has(e.source) && e.target !== id) linked.add(e.target);
      if (officerIds.has(e.target) && e.source !== id) linked.add(e.source);
    }
    const linkedNodes = graph.nodes.filter((n) => n.type === "company" && linked.has(n.id));
    const active = linkedNodes.filter((n) => (n.status ?? "").toLowerCase().includes("active")).length;
    return { directors: officers.length, linked: linkedNodes.length, active };
  }, [graph, focusFirm]);

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
        if (!res.ok) {
          let msg = `Companies House lookup failed (${res.status})`;
          try {
            const j = await res.json();
            if (j?.error) msg = j.error;
          } catch {}
          throw new Error(msg);
        }
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
          ? `Pulling ${focusFirm?.name ?? "firm"}'s records live from Companies House…`
          : graph.nodes.some((n) => n.id === focusFirm?.id)
            ? `Live refresh unavailable (${resolveError}) — showing the records we already hold.`
            : `Could not load this firm: ${resolveError}`}
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
            graph={focusFirm ? displayedGraph : graph}
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
  const backToStart = () => {
    resolveAbort.current?.abort();
    setFocusFirm(null);
    setSelectedNode(null);
    setFocusId(null);
    setResolveError(null);
    setResolving(false);
  };

  return (
    <div style={{ fontFamily: "Arial, Helvetica, sans-serif" }} className="text-[#3f3f3f]">
      {/* Hero */}
      <section className="border-b border-[#d2d2d4] bg-[#f0f0f1]">
        <div className="mx-auto max-w-[1560px] px-4 py-6 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#6c1d45]">Phoenix Watch</h1>
              <p className="mt-1 max-w-3xl text-[15px] leading-relaxed text-[#3f3f3f]">
                The FCA fines a firm. The firm quietly dissolves. Its directors start again behind
                brand-new companies. Phoenix Watch finds them — using nothing but public records.
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href="/phoenix-watch/intro"
                className="border border-[#6c1d45] bg-[#6c1d45] px-3 py-2 text-[13px] font-bold text-white hover:bg-[#59183a]"
              >
                ▶ Watch the intro
              </a>
              <button
                onClick={() => setPresent(true)}
                title="Full-screen map for a projector. Keys 1, 2, 3 jump between the cases; Esc returns here."
                className="border border-[#6c1d45] bg-white px-3 py-2 text-left text-[13px] font-bold leading-tight text-[#6c1d45] hover:bg-[#6c1d45] hover:text-white"
              >
                Big-screen mode
                <span className="block text-[10px] font-normal opacity-75">for projectors · Esc exits</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1560px] px-4 py-5 md:px-8">
        {!focusFirm ? (
          <>
            {/* STEP 1 — nothing loads until the user chooses */}
            <section className="border border-[#d2d2d4] bg-white">
              <div className="border-b border-[#d2d2d4] bg-[#6c1d45] px-4 py-3">
                <h2 className="text-[15px] font-bold text-white">Step 1 of 3 — choose a firm to investigate</h2>
                <p className="text-[12px] text-white/75">
                  Start with one of the three headline failures, or search any UK firm. Its network
                  is built in front of you from live Companies House records.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
                {CASES.map((c, i) => (
                  <button
                    key={c.number}
                    onClick={() => resolveFirm(c.number, c.name)}
                    disabled={resolving}
                    className="group flex flex-col border border-[#d2d2d4] bg-white p-4 text-left hover:border-[#6c1d45] disabled:opacity-60"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[#75767a]">
                      Case {i + 1}
                    </span>
                    <span className="mt-1 text-[17px] font-bold leading-snug text-[#6c1d45]">{c.name}</span>
                    <span className="mt-1 flex-1 text-[13px] leading-relaxed text-[#3f3f3f]">{c.blurb}</span>
                    <span className="mt-3 inline-block self-start bg-[#6c1d45] px-3 py-1.5 text-[13px] font-bold text-white group-hover:bg-[#59183a]">
                      {resolving && focusFirm ? "Working…" : "Investigate →"}
                    </span>
                  </button>
                ))}
              </div>
              <div className="border-t border-[#d2d2d4] p-4">
                <p className="mb-2 text-[13px] font-bold text-[#3f3f3f]">Or investigate any UK firm:</p>
                <div className="max-w-2xl">
                  <SearchBar onSelect={resolveFirm} busy={resolving} hideCases />
                </div>
              </div>
            </section>

            {/* Browse route in — the sweep */}
            <div className="mt-4">
              <SweepTable onLoadFirm={resolveFirm} />
            </div>

            {/* What's behind this — provenance and scope, in plain English */}
            <section className="mt-4 border border-[#d2d2d4] bg-white">
              <div className="border-b border-[#d2d2d4] bg-[#f0f0f1] px-4 py-2">
                <h2 className="text-sm font-bold text-[#6c1d45]">What&apos;s behind this</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 p-4 text-[13px] leading-relaxed md:grid-cols-4">
                <div>
                  <b className="text-[#6c1d45]">The fines.</b> Every fine the FCA published between
                  2013 and 2025 — 300 of them, harvested from fca.org.uk. The complete public list,
                  not a hand-picked sample.
                </div>
                <div>
                  <b className="text-[#6c1d45]">The companies and directors.</b> Pulled live from
                  Companies House&apos;s public register at the moment you ask — nothing is
                  pre-baked or stale.
                </div>
                <div>
                  <b className="text-[#6c1d45]">The risk score.</b> A transparent indicator built
                  from timing, shared addresses, shared industry and co-directors — the working is
                  always shown. It says &ldquo;look here first&rdquo;, not &ldquo;guilty&rdquo;.
                </div>
                <div>
                  <b className="text-[#6c1d45]">Where it could go.</b> The same approach extends to
                  the FCA Warning List, insolvency notices, daily new incorporations — and from a
                  one-off sweep to continuous monitoring with alerts.
                </div>
              </div>
            </section>
          </>
        ) : (
          <>
            {/* Progress bar — you are here */}
            <div className="mb-4 flex flex-wrap items-center gap-2 text-[13px]">
              <button
                onClick={backToStart}
                className="border border-[#6c1d45] bg-white px-3 py-1.5 font-bold text-[#6c1d45] hover:bg-[#6c1d45] hover:text-white"
              >
                ← Choose another firm
              </button>
              <span className="border border-[#d2d2d4] bg-white px-3 py-1.5">
                <b className="text-[#2E6A52]">✓ 1</b> · {focusFirm.name}
              </span>
              <span className="border border-[#d2d2d4] bg-white px-3 py-1.5">
                <b className="text-[#6c1d45]">2</b> · Read the map — <span className="text-[#ff585d] font-bold">red</span> = started
                after the failure, still active. Drag the dots around.
              </span>
              <span className="border border-[#d2d2d4] bg-white px-3 py-1.5">
                <b className="text-[#6c1d45]">3</b> · Interrogate — click anything, ask Claude below, or generate the dossier
              </span>
            </div>

            {/* Case banner — the story in one line */}
            {caseStats ? (
              <div className="mb-4 flex flex-wrap items-baseline gap-x-6 gap-y-1 border border-[#d2d2d4] border-l-4 border-l-[#6c1d45] bg-white px-4 py-3 text-[14px]">
                <span className="text-[16px] font-bold text-[#6c1d45]">{focusFirm.name}</span>
                <span>
                  <b>{caseStats.directors}</b> directors traced
                </span>
                <span>
                  <b>{caseStats.linked}</b> other companies where they reappear
                </span>
                <span className="font-bold text-[#ff585d]">{caseStats.active} still active today</span>
              </div>
            ) : null}

            {/* Graph + detail */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_400px]">
              <div className="flex flex-col border border-[#d2d2d4] bg-white">
                <div className="flex items-center justify-between border-b border-[#d2d2d4] bg-[#f0f0f1] px-4 py-2">
                  <h2 className="text-sm font-bold text-[#6c1d45]">The network — who rose again</h2>
                  <Legend />
                </div>
                <div className="relative h-[600px]">
                  {resolveBanner}
                  <GraphStage
                    graph={displayedGraph}
                    timelineDate={timelineDate}
                    selectedId={selectedNode?.id}
                    focusId={focusId}
                    focusNonce={focusNonce}
                    onNodeClick={onNodeClick}
                  />
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
                <BriefingPanel graph={graph} focusId={briefingFocusId} focusName={focusFirm.name} />
                {selectedNode ? (
                  <div className="max-h-[480px] overflow-auto border border-[#d2d2d4] bg-white">
                    <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} onDossier={setDossierNode} />
                  </div>
                ) : (
                  <p className="border border-dashed border-[#d2d2d4] bg-white px-3 py-3 text-[13px] text-[#75767a]">
                    <b className="text-[#3f3f3f]">Tip:</b> click any square (company) or circle
                    (director) in the map — its Companies House record and the working behind its risk
                    score appear here.
                  </p>
                )}
              </div>
            </div>

            {/* Chat + sweep */}
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="h-[460px]">
                <ChatDock graph={graph} onGraphMerge={onGraphMerge} />
              </div>
              <SweepTable onLoadFirm={resolveFirm} />
            </div>
          </>
        )}
      </div>

      <DossierModal graph={graph} node={dossierNode} onClose={() => setDossierNode(null)} />
    </div>
  );
}

function Legend() {
  const items: [string, string, "sq" | "ci"][] = [
    ["#6c1d45", "Company", "sq"],
    ["#ff585d", "Started after the failure — still active", "sq"],
    ["#75767a", "Dissolved", "sq"],
    ["#003c71", "Director", "ci"],
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
