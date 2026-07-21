"use client";

/**
 * ChatPanel — minimal, production-quality streaming chat UI. TEMPLATE.
 *
 * Pairs with chat-route.ts (POST /api/chat, streams text/plain).
 * Styling uses the site's Tailwind tokens (ink / teal / line / text-soft …);
 * if you drop this into a bare create-next-app, swap those for slate/zinc classes.
 *
 * Usage:
 *   <ChatPanel
 *     endpoint="/api/chat"
 *     system="You answer questions about FCA enforcement fines."
 *     contextDocs={JSON.stringify(fines)}
 *     starterQuestions={["Which firm was fined the most in 2024?"]}
 *   />
 */

import { useCallback, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatPanel({
  endpoint = "/api/chat",
  system,
  contextDocs,
  placeholder = "Ask a question…",
  title = "Ask the data",
  starterQuestions = [],
}: {
  endpoint?: string;
  system?: string;
  contextDocs?: string;
  placeholder?: string;
  title?: string;
  starterQuestions?: string[];
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToEnd = () =>
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || busy) return;

      const next: Msg[] = [...messages, { role: "user", content: question }];
      setMessages([...next, { role: "assistant", content: "" }]);
      setInput("");
      setBusy(true);
      scrollToEnd();

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next, system, contextDocs }),
        });
        if (!res.ok || !res.body) throw new Error(await res.text().catch(() => res.statusText));

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const copy = prev.slice();
            copy[copy.length - 1] = { role: "assistant", content: acc };
            return copy;
          });
          scrollToEnd();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong.";
        setMessages((prev) => {
          const copy = prev.slice();
          copy[copy.length - 1] = { role: "assistant", content: `⚠️ ${message}` };
          return copy;
        });
      } finally {
        setBusy(false);
        scrollToEnd();
      }
    },
    [messages, busy, endpoint, system, contextDocs],
  );

  return (
    <div className="flex flex-col h-[32rem] w-full rounded-2xl border border-line bg-ink-2/60 backdrop-blur-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-line flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-teal shadow shadow-teal/40" />
        <h3 className="text-sm font-bold text-text">{title}</h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-muted text-sm">Ask anything about the data below.</p>
            <div className="flex flex-wrap gap-2">
              {starterQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-xs text-text-soft border border-line rounded-full px-3 py-1.5 hover:border-teal hover:text-teal transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-sm bg-teal text-ink px-3.5 py-2 text-sm font-medium"
                  : "max-w-[85%] rounded-2xl rounded-bl-sm bg-ink border border-line text-text-soft px-3.5 py-2 text-sm whitespace-pre-wrap leading-relaxed"
              }
            >
              {m.content || (busy && i === messages.length - 1 ? <TypingDots /> : "")}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-line p-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={busy}
          className="flex-1 bg-ink border border-line rounded-full px-4 py-2 text-sm text-text placeholder:text-muted-dark focus:outline-none focus:border-teal disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="bg-teal text-ink text-sm font-bold px-4 py-2 rounded-full hover:bg-teal-bright transition-colors disabled:opacity-40"
        >
          {busy ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-1" aria-label="Assistant is typing">
      <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" />
    </span>
  );
}
