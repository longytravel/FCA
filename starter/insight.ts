/**
 * insight.ts — send any JSON dataset to Claude, get back an executive briefing. TEMPLATE.
 *
 * Server-side only (uses ANTHROPIC_API_KEY). Call from a route handler, a Server
 * Component, or a one-off script. Non-streaming: returns the full briefing string.
 *
 * Install:  npm i @anthropic-ai/sdk
 *
 * Example (inside app/api/insight/route.ts):
 *   const briefing = await generateInsight(finesData, {
 *     audience: "FCA supervision leadership",
 *     question: "What are the emerging enforcement themes this year?",
 *   });
 */

import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-fable-5";

export type InsightOptions = {
  /** Who is reading — tunes tone and level of detail. */
  audience?: string;
  /** A specific question to anchor the briefing. Optional. */
  question?: string;
  /** Extra domain framing prepended to the system prompt. */
  context?: string;
  /** Max output tokens. Default 1200. */
  maxTokens?: number;
  /** Model override. */
  model?: string;
};

/**
 * Summarise a dataset into a structured executive briefing.
 * `data` can be any JSON-serialisable value (array of records is ideal).
 */
export async function generateInsight(
  data: unknown,
  options: InsightOptions = {},
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const {
    audience = "a senior executive with limited time",
    question,
    context,
    maxTokens = 1200,
    model = MODEL,
  } = options;

  const anthropic = new Anthropic({ apiKey });

  // Keep the payload well under context limits; trim if huge.
  const serialised = JSON.stringify(data, null, 0).slice(0, 180_000);

  const system =
    `You are a data analyst writing an executive briefing for ${audience}. ` +
    `Ground EVERY claim in the supplied data — never invent figures. ` +
    `Structure the briefing as:\n` +
    `1. **Headline** — one sentence, the single most important takeaway.\n` +
    `2. **Key findings** — 3 to 5 bullets, each with a concrete number or fact.\n` +
    `3. **What stands out** — the most surprising or actionable pattern.\n` +
    `4. **Suggested next question** — one thing worth investigating further.\n` +
    `Be crisp and quantitative. No preamble.` +
    (context ? `\n\nDomain context: ${context}` : "");

  const userPrompt =
    (question ? `Focus question: ${question}\n\n` : "") +
    `Here is the dataset (JSON):\n${serialised}`;

  const res = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: userPrompt }],
  });

  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
