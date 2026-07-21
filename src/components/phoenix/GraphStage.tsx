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
  onNodeClick,
}: {
  graph: PhoenixGraph;
  timelineDate: number | null;
  selectedId?: string | null;
  focusId?: string | null;
  focusNonce?: number;
  present?: boolean;
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
    const color = nodeColor(node);
    const isSel = node.id === selectedId;
    const isHot = node.id === activeId;

    if (node.type === "officer") {
      const r = officerRadius(node);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      if (isSel || isHot) {
        ctx.lineWidth = 2 / scale;
        ctx.strokeStyle = FCA.yellow;
        ctx.stroke();
      }
    } else {
      const s = 8;
      ctx.fillStyle = color;
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
      if (isSel || isHot) {
        ctx.lineWidth = 2 / scale;
        ctx.strokeStyle = FCA.yellow;
        ctx.strokeRect(x - s / 2 - 1, y - s / 2 - 1, s + 2, s + 2);
      }
    }

    // Labels: seeds always; others when zoomed in or highlighted.
    const seed = node.tags?.some((t) => t === "phoenix-seed" || t === "fined-seed");
    if (seed || isSel || isHot || scale > 2.2) {
      const label = node.name.length > 34 ? node.name.slice(0, 33) + "…" : node.name;
      const fontSize = Math.max(9, 11 / scale);
      ctx.font = `${seed ? "bold " : ""}${fontSize}px Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = seed ? FCA.mulberry : FCA.body;
      ctx.fillText(label, x, y + (node.type === "officer" ? officerRadius(node) : 5) + 1.5);
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
