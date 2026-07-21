import { NextRequest, NextResponse } from "next/server";
import { searchCompanies } from "@/src/lib/phoenix/ch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/ch/search?q= — live Companies House typeahead.
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ items: [] });

  try {
    const raw = await searchCompanies(q, 8);
    const items = raw.map((i) => ({
      title: i.title,
      company_number: i.company_number,
      company_status: i.company_status,
      date_of_creation: i.date_of_creation,
      address_snippet: i.address_snippet,
    }));
    return NextResponse.json({ items });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Companies House search failed";
    return NextResponse.json({ error: message, items: [] }, { status: 502 });
  }
}
