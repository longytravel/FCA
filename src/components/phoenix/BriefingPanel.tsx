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
      <div className="flex items-center justify-between gap-2 border-b border-[#d2d2d4] bg-[#f0f0f1] px-4 py-2">
        <h3 className="truncate text-sm font-bold text-[#6c1d45]">
          Claude&apos;s assessment{focusName ? ` — ${focusName}` : ""}
        </h3>
        {loading ? <span className="shrink-0 text-[12px] text-[#75767a]">writing…</span> : null}
      </div>
      <div className="px-4 py-3 text-[14px] leading-relaxed text-[#3f3f3f]">
        {!focusId ? (
          <p className="text-[13px] text-[#75767a]">
            Pick a case above — Claude reads the network and writes a plain-English assessment
            here, live.
          </p>
        ) : error ? (
          <p className="text-[13px] text-[#ff585d]">
            Briefing unavailable: {error}. The AI service may be busy — try another firm or retry.
          </p>
        ) : text ? (
          <div className="whitespace-pre-wrap">
            {text.split("\n").map((line, i) => {
              const m = line.match(/^(VERDICT:|WORTH CHECKING NEXT:)(.*)$/);
              return m ? (
                <p key={i} className={i > 0 ? "mt-2" : ""}>
                  <b className="text-[#6c1d45]">{m[1]}</b>
                  {m[2]}
                </p>
              ) : (
                <p key={i} className={line.trim() === "" ? "h-2" : i > 0 ? "mt-1" : ""}>
                  {line}
                </p>
              );
            })}
            {loading ? <span className="ml-[1px] inline-block h-4 w-[2px] animate-pulse bg-[#6c1d45] align-middle" /> : null}
          </div>
        ) : (
          <p className="text-[13px] text-[#75767a]">
            Preparing briefing for <span className="font-bold text-[#6c1d45]">{focusName ?? focusId}</span>…
          </p>
        )}
      </div>
      <div className="border-t border-[#d2d2d4] bg-[#f0f0f1] px-4 py-2 text-[12px] leading-relaxed text-[#75767a]">
        <b className="text-[#3f3f3f]">What&apos;s happening here:</b> the network on the left —
        every company, director and date, {graph.nodes.length} records fresh from Companies House —
        is sent to Claude (Anthropic&apos;s AI) over its live API. The words stream in as Claude
        writes them, right now. Nothing is scripted, cached or pre-written, and Claude may only
        cite what&apos;s in those records.
      </div>
    </section>
  );
}
