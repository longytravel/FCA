"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import type { PhoenixGraph, PNode } from "@/src/lib/phoenix/types";
import {
  FCA,
  nodeColor,
  officerRadius,
  endId,
  edgeKey,
  computeAppearance,
} from "./graph-utils";

// force-graph's canvas-callback prop types are extremely strict; the runtime
// contract is simple, so present a permissive prop surface to callers here.
const ForceGraphInner = dynamic(() => import("./ForceGraphInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-[#75767a]">
      Loading network canvas…
    </div>
  ),
}) as unknown as ComponentType<Record<string, unknown> & { onReady?: (instance: unknown) => void }>;

// force-graph mutates node objects in place (adds x/y/vx/vy) — model that loosely.
type FNode = PNode & { x?: number; y?: number; vx?: number; vy?: number; __rf?: boolean };
type FLink = { source: string | FNode; target: string | FNode; role: string; appointed_on?: string; resigned_on?: string };
type GraphInstance = {
  zoomToFit: (ms?: number, px?: number, filter?: (n: FNode) => boolean) => void;
  centerAt: (x?: number, y?: number, ms?: number) => void;
  zoom: (k?: number, ms?: number) => void;
  d3ReheatSimulation?: () => void;
};

export default function GraphStage({
  graph,
  timelineDate,
  selectedId,
  focusId,
  focusNonce,
  present,
  failureMs,
  onNodeClick,
}: {
  graph: PhoenixGraph;
  timelineDate: number | null;
  selectedId?: string | null;
  focusId?: string | null;
  focusNonce?: number;
  present?: boolean;
  /** When the investigated firm failed/was fined — red requires incorporation on/after this. */
  failureMs?: number | null;
  onNodeClick: (node: PNode) => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const fgRef = useRef<GraphInstance | null>(null);
  const prevNodes = useRef<Map<string, FNode>>(new Map());
  const [size, setSize] = useState({ w: 800, h: 520 });
  const [hoverId, setHoverId] = useState<string | null>(null);

  // Responsive sizing.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: Math.max(320, r.width), h: Math.max(360, r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Build graphData, reusing prior node objects so physics positions survive live merges.
  const graphData = useMemo(() => {
    const nodes: FNode[] = graph.nodes.map((n) => {
      const prev = prevNodes.current.get(n.id);
      return prev ? Object.assign(prev, n) : ({ ...n } as FNode);
    });
    const links: FLink[] = graph.edges.map((e) => ({
      source: endId(e.source),
      target: endId(e.target),
      role: e.role,
      appointed_on: e.appointed_on,
      resigned_on: e.resigned_on,
    }));
    return { nodes, links };
  }, [graph]);

  useEffect(() => {
    const m = new Map<string, FNode>();
    for (const n of graphData.nodes) m.set(n.id, n);
    prevNodes.current = m;
  }, [graphData]);

  const { nodeAppear, edgeAppear } = useMemo(() => computeAppearance(graph), [graph]);

  // Neighbour set for highlight (edges touching hovered/selected node).
  const activeId = hoverId ?? selectedId ?? null;
  const neighbourEdges = useMemo(() => {
    const set = new Set<string>();
    if (!activeId) return set;
    for (const e of graph.edges) {
      if (endId(e.source) === activeId || endId(e.target) === activeId) set.add(edgeKey(e));
    }
    return set;
  }, [graph, activeId]);

  const nodeVisible = (node: FNode) => {
    if (timelineDate == null) return true;
    const appear = nodeAppear.get(node.id) ?? 0;
    return appear <= timelineDate;
  };
  const linkVisible = (link: FLink) => {
    if (timelineDate == null) return true;
    const key = `${endId(link.source as never)}->${endId(link.target as never)}:${link.role}`;
    const appear = edgeAppear.get(key) ?? 0;
    return appear <= timelineDate;
  };

  // Fit on first data + on major merges.
  const fittedFor = useRef(0);
  useEffect(() => {
    if (!fgRef.current || graphData.nodes.length === 0) return;
    if (graphData.nodes.length === fittedFor.current) return;
    fittedFor.current = graphData.nodes.length;
    const t = setTimeout(() => fgRef.current?.zoomToFit(600, present ? 80 : 40), 400);
    return () => clearTimeout(t);
  }, [graphData, present]);

  // Focus a specific node (presenter keys, sweep-row click).
  useEffect(() => {
    if (!focusId || !fgRef.current) return;
    const t = setTimeout(() => {
      const n = prevNodes.current.get(focusId);
      if (n && typeof n.x === "number" && typeof n.y === "number") {
        fgRef.current?.centerAt(n.x, n.y, 700);
        fgRef.current?.zoom(2.4, 700);
      } else {
        fgRef.current?.zoomToFit(600, 60);
      }
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, focusNonce]);

  const paintNode = (node: FNode, ctx: CanvasRenderingContext2D, scale: number) => {
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    const color = nodeColor(node, failureMs);
    const isSel = node.id === selectedId;
    const isHot = node.id === activeId;

    if (node.type === "officer") {
      const r = officerRadius(node);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      // Gold circles need a dark rim to read on a white canvas.
      ctx.lineWidth = (isSel || isHot ? 2.5 : 1.2) / scale;
      ctx.strokeStyle = isSel || isHot ? FCA.mulberry : FCA.navy;
      ctx.stroke();
    } else {
      const seed = node.tags?.some((t) => t === "phoenix-seed" || t === "fined-seed");
      const phoenix = color === FCA.phoenix;
      const s = seed ? 13 : phoenix ? 10 : 8;
      ctx.fillStyle = color;
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
      if (isSel || isHot) {
        ctx.lineWidth = 2 / scale;
        ctx.strokeStyle = FCA.yellow;
        ctx.strokeRect(x - s / 2 - 1, y - s / 2 - 1, s + 2, s + 2);
      }
    }
    // Labels are painted in a separate post-frame pass (paintLabels) so they can
    // be prioritised and collision-culled — two labels never overlap.
  };

  // ---- Label pass: priority order + collision culling ----------------------
  // The investigated firm and selection always win; during timeline replay the
  // just-appeared companies get their names shown ("names coming up"); phoenix
  // companies next; everything else only when zoomed in far enough for room.
  const RECENT_MS = 548 * 24 * 3600 * 1000; // ~18 months of replay time
  const paintLabels = (ctx: CanvasRenderingContext2D, scale: number) => {
    const seedOf = (n: FNode) => n.tags?.some((t) => t === "phoenix-seed" || t === "fined-seed");
    const cand: { n: FNode; pri: number }[] = [];
    for (const n of graphData.nodes as FNode[]) {
      if (typeof n.x !== "number" || typeof n.y !== "number") continue;
      if (!nodeVisible(n)) continue;
      const isSel = n.id === selectedId || n.id === activeId;
      const seed = seedOf(n);
      const phx = nodeColor(n, failureMs) === FCA.phoenix;
      const appear = nodeAppear.get(n.id) ?? 0;
      const recent = timelineDate != null && appear > 0 && appear >= timelineDate - RECENT_MS;
      let pri = -1;
      if (seed || isSel) pri = 0;
      else if (recent) pri = 1;
      else if (phx) pri = 2;
      else if (n.type === "officer") pri = 3; // directors always try — culling keeps it tidy
      else if (scale > 2.8) pri = 4;
      if (pri >= 0) cand.push({ n, pri });
    }
    cand.sort((a, b) => a.pri - b.pri);
    const rects: [number, number, number, number][] = [];
    const overlaps = (r: [number, number, number, number]) =>
      rects.some((o) => r[0] < o[2] && r[2] > o[0] && r[1] < o[3] && r[3] > o[1]);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const { n, pri } of cand) {
      const isSel = n.id === selectedId || n.id === activeId;
      const seed = seedOf(n);
      const phx = nodeColor(n, failureMs) === FCA.phoenix;
      let raw = n.name;
      if (n.type === "officer" && !isSel && pri >= 3) raw = raw.split(",")[0];
      const label = raw.length > 28 ? raw.slice(0, 27) + "…" : raw;
      const fpx = (seed || isSel ? 13.5 : pri <= 2 ? 11.5 : 10) / scale;
      ctx.font = `${seed || isSel || phx ? "bold " : ""}${fpx}px Arial, sans-serif`;
      const w = ctx.measureText(label).width;
      const x = n.x as number;
      const ty = (n.y as number) + (n.type === "officer" ? officerRadius(n) : 7) + 2 / scale;
      const pad = 2.5 / scale;
      const rect: [number, number, number, number] = [x - w / 2 - pad, ty - pad, x + w / 2 + pad, ty + fpx + pad];
      if (pri > 0 && overlaps(rect)) continue; // the firm + selection always draw
      ctx.fillStyle = "rgba(255,255,255,0.93)";
      ctx.fillRect(rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1]);
      ctx.fillStyle = seed ? FCA.mulberry : phx ? FCA.phoenix : n.type === "officer" ? FCA.navy : FCA.body;
      ctx.fillText(label, x, ty);
      rects.push(rect);
    }
  };

  const paintPointerArea = (node: FNode, color: string, ctx: CanvasRenderingContext2D) => {
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    ctx.fillStyle = color;
    if (node.type === "officer") {
      const r = officerRadius(node) + 2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      const s = 11;
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
    }
  };

  const paintLinkLabel = (link: FLink, ctx: CanvasRenderingContext2D, scale: number) => {
    const key = `${endId(link.source as never)}->${endId(link.target as never)}:${link.role}`;
    if (!neighbourEdges.has(key)) return;
    const s = link.source as FNode;
    const t = link.target as FNode;
    if (typeof s?.x !== "number" || typeof t?.x !== "number") return;
    const mx = (s.x + (t.x ?? 0)) / 2;
    const my = ((s.y ?? 0) + (t.y ?? 0)) / 2;
    const fontSize = Math.max(8, 10 / scale);
    ctx.font = `${fontSize}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const text = link.role;
    const w = ctx.measureText(text).width;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(mx - w / 2 - 2, my - fontSize / 2 - 1, w + 4, fontSize + 2);
    ctx.fillStyle = FCA.muted;
    ctx.fillText(text, mx, my);
  };

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      <ForceGraphInner
        onReady={(inst: unknown) => {
          fgRef.current = inst as GraphInstance;
        }}
        graphData={graphData as never}
        width={size.w}
        height={size.h}
        backgroundColor="#ffffff"
        nodeRelSize={5}
        nodeVal={(n: FNode) => (n.type === "officer" ? 2 : 3)}
        nodeVisibility={nodeVisible as never}
        linkVisibility={linkVisible as never}
        nodeLabel={(n: FNode) =>
          `${n.name}${n.status ? " · " + n.status : ""}${
            typeof n.risk === "number" ? " · risk " + n.risk : ""
          }`
        }
        linkLabel={(l: FLink) => l.role}
        nodeCanvasObject={paintNode as never}
        nodePointerAreaPaint={paintPointerArea as never}
        onRenderFramePost={paintLabels as never}
        linkCanvasObjectMode={() => "after"}
        linkCanvasObject={paintLinkLabel as never}
        linkColor={(l: FLink) => {
          const key = `${endId(l.source as never)}->${endId(l.target as never)}:${l.role}`;
          return neighbourEdges.has(key) ? FCA.mulberry : "#d2d2d4";
        }}
        linkWidth={(l: FLink) => {
          const key = `${endId(l.source as never)}->${endId(l.target as never)}:${l.role}`;
          return neighbourEdges.has(key) ? 2 : 1;
        }}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={1}
        onNodeClick={(n: FNode) => onNodeClick(n)}
        onNodeHover={(n: FNode | null) => setHoverId(n ? n.id : null)}
        cooldownTicks={present ? 200 : 120}
        warmupTicks={20}
      />
    </div>
  );
}
