import { NextRequest, NextResponse } from "next/server";
import { resolvePhoenixGraph } from "@/src/lib/phoenix/ch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET /api/phoenix/resolve?company=NUM — live chain, returns { graph, meta }.
export async function GET(req: NextRequest) {
  const company = req.nextUrl.searchParams.get("company")?.trim();
  if (!company) {
    return NextResponse.json({ error: "Missing ?company parameter" }, { status: 400 });
  }

  try {
    const graph = await resolvePhoenixGraph(company);
    const seed = graph.nodes.find((n) => n.type === "company" && n.tags.includes("phoenix-seed"));
    if (!seed) {
      return NextResponse.json({ error: `Company ${company} not found at Companies House` }, { status: 404 });
    }
    return NextResponse.json({
      graph,
      meta: { firm: seed.name, resolvedAt: new Date().toISOString() },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to resolve company network";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
