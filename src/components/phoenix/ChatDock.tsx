"use client";

import { useEffect, useRef, useState } from "react";
import type { PhoenixGraph, PNode, PEdge } from "@/src/lib/phoenix/types";
import { streamNDJSON, type ChatEvent } from "./stream";

type Msg = { role: "user" | "assistant"; content: string; tools?: string[] };

const SUGGESTIONS = [
  "Which active companies share directors with this firm?",
  "Who resurfaced fastest after the collapse?",
  "Trace the officers of the newest linked company.",
];

export default function ChatDock({
  graph,
  onGraphMerge,
}: {
  graph: PhoenixGraph;
  onGraphMerge: (nodes: PNode[], edges: PEdge[]) => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef(graph);
  graphRef.current = graph;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || busy) return;
    setError(null);
    setInput("");
    const history: Msg[] = [...messages, { role: "user", content: clean }];
    setMessages([...history, { role: "assistant", content: "", tools: [] }]);
    setBusy(true);

    const apiMessages = history.map((m) => ({ role: m.role, content: m.content }));

    const patchAssistant = (fn: (m: Msg) => Msg) => {
      setMessages((prev) => {
        const copy = [...prev];
        const idx = copy.length - 1;
        if (idx >= 0 && copy[idx].role === "assistant") copy[idx] = fn(copy[idx]);
        return copy;
      });
    };

    try {
      await streamNDJSON(
        "/api/ai/chat",
        { messages: apiMessages, graph: graphRef.current },
        (ev: ChatEvent) => {
          if (ev.type === "text") {
            patchAssistant((m) => ({ ...m, content: m.content + ev.delta }));
          } else if (ev.type === "tool") {
            patchAssistant((m) => ({ ...m, tools: [...(m.tools ?? []), ev.label] }));
          } else if (ev.type === "graph") {
            if (ev.nodes?.length || ev.edges?.length) {
              onGraphMerge(ev.nodes ?? [], ev.edges ?? []);
            }
          } else if (ev.type === "error") {
            setError(ev.message);
          }
        },
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex h-full flex-col border border-[#d2d2d4] bg-white">
      <div className="border-b border-[#d2d2d4] bg-[#6c1d45] px-4 py-2">
        <h3 className="text-sm font-bold text-white">Ask this network</h3>
        <p className="text-[12px] text-white/75">
          Ask a question in plain English — Claude checks Companies House live and adds what it
          finds to the map above.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <div className="space-y-2">
            <p className="text-[13px] text-[#75767a]">Try:</p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="block w-full border border-[#d2d2d4] bg-white px-3 py-2 text-left text-[13px] text-[#3f3f3f] hover:border-[#6c1d45] hover:text-[#6c1d45]"
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
              {m.tools && m.tools.length > 0 ? (
                <div className="mb-1 flex flex-wrap gap-1">
                  {m.tools.map((t, ti) => (
                    <span
                      key={ti}
                      className="inline-block border border-[#00bfb3] bg-[#e6f8f6] px-2 py-[1px] text-[11px] text-[#004851]"
                    >
                      ⚙ {t}
                    </span>
                  ))}
                </div>
              ) : null}
              <div
                className={`inline-block max-w-[92%] whitespace-pre-wrap px-3 py-2 text-[13px] leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#6c1d45] text-white"
                    : "border border-[#d2d2d4] bg-[#f8f8f9] text-[#3f3f3f]"
                }`}
              >
                {m.content || (busy && m.role === "assistant" ? <span className="text-[#75767a]">Thinking…</span> : "")}
              </div>
            </div>
          ))
        )}
        {error ? (
          <p className="text-[12px] text-[#ff585d]">Chat error: {error}</p>
        ) : null}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex border-t border-[#d2d2d4]"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
          placeholder={busy ? "Working…" : "Ask about directors, addresses, timing…"}
          className="flex-1 bg-white px-3 py-2 text-[13px] text-[#3f3f3f] placeholder:text-[#9a9a9d] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6c1d45]"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="bg-[#6c1d45] px-4 text-[13px] font-bold text-white disabled:bg-[#d2d2d4]"
        >
          Send
        </button>
      </form>
    </section>
  );
}
