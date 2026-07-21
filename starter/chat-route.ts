/**
 * Next.js App Router streaming chat route — TEMPLATE.
 *
 * Drop into  app/api/chat/route.ts  of a fresh build.
 * Streams Claude responses token-by-token (SSE-style ReadableStream) so the
 * ChatPanel renders text as it arrives.
 *
 * Env required:  ANTHROPIC_API_KEY   (server-only; never expose to the client)
 * Install:       npm i @anthropic-ai/sdk
 *
 * Request body (POST, JSON):
 *   {
 *     messages:    { role: "user" | "assistant"; content: string }[],
 *     system?:     string,          // optional system prompt override
 *     contextDocs?: string          // optional grounding context (JSON/text) injected into system
 *   }
 *
 * Response: text/plain stream of the assistant's answer.
 */

import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs"; // SDK needs Node, not edge
export const dynamic = "force-dynamic";

const MODEL = "claude-fable-5"; // swap to "claude-sonnet-5" for cheaper/faster demos

const DEFAULT_SYSTEM =
  "You are a precise, plain-English analyst answering questions grounded ONLY in the " +
  "context provided. If the answer is not in the context, say so rather than guessing. " +
  "Cite concrete figures, dates and identifiers from the data. Be concise.";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("ANTHROPIC_API_KEY is not set", { status: 500 });
  }

  let body: { messages?: ChatMessage[]; system?: string; contextDocs?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const messages = (body.messages ?? []).filter(
    (m): m is ChatMessage => !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
  );
  if (messages.length === 0) {
    return new Response("No messages provided", { status: 400 });
  }

  const system =
    (body.system?.trim() || DEFAULT_SYSTEM) +
    (body.contextDocs
      ? `\n\n<context>\n${body.contextDocs.slice(0, 180_000)}\n</context>`
      : "");

  const anthropic = new Anthropic({ apiKey });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const events = await anthropic.messages.stream({
          model: MODEL,
          max_tokens: 1536,
          system,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        });

        for await (const event of events) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "stream error";
        controller.enqueue(encoder.encode(`\n\n[error: ${message}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
