"use client";

import { useEffect, useRef, useState } from "react";
import type { PhoenixGraph } from "@/src/lib/phoenix/types";
import { streamText } from "./stream";

export default function BriefingPanel({
  graph,
  focusId,
  focusName,
}: {
  graph: PhoenixGraph;
  focusId: string | null;
  focusName: string | null;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!focusId) {
      setText("");
      setError(null);
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setText("");
    setError(null);
    setLoading(true);
    streamText("/api/ai/insight", { graph, focusId }, (full) => setText(full), ac.signal)
      .catch((e) => {
        if ((e as Error).name !== "AbortError") setError((e as Error).message);
      })
      .finally(() => setLoading(false));
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);

  return (
    <section className="border border-[#d2d2d4] bg-white">
      <div className="flex items-center justify-between border-b border-[#d2d2d4] bg-[#f0f0f1] px-4 py-2">
        <h3 className="text-sm font-bold text-[#6c1d45]">AI risk briefing</h3>
        {loading ? <span className="text-[12px] text-[#75767a]">Claude is writing…</span> : null}
      </div>
      <div className="px-4 py-3 text-[14px] leading-relaxed text-[#3f3f3f]">
        {!focusId ? (
          <p className="text-[13px] text-[#75767a]">
            Select a firm to stream a live Claude briefing grounded in the resolved network —
            citing company numbers and dates, never inventing.
          </p>
        ) : error ? (
          <p className="text-[13px] text-[#ff585d]">
            Briefing unavailable: {error}. The AI service may be busy — try another firm or retry.
          </p>
        ) : text ? (
          <p className="whitespace-pre-wrap">
            {text}
            {loading ? <span className="ml-[1px] inline-block h-4 w-[2px] animate-pulse bg-[#6c1d45] align-middle" /> : null}
          </p>
        ) : (
          <p className="text-[13px] text-[#75767a]">
            Preparing briefing for <span className="font-bold text-[#6c1d45]">{focusName ?? focusId}</span>…
          </p>
        )}
      </div>
    </section>
  );
}
