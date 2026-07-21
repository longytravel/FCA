import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/phoenix/sweep — serves the pre-generated sweep league table from disk.
export async function GET() {
  const file = path.join(process.cwd(), "data", "fixtures", "sweep-results.json");
  if (!fs.existsSync(file)) {
    return NextResponse.json(
      { error: "Sweep not generated yet — run node scripts/sweep.mjs" },
      { status: 404 },
    );
  }
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to read sweep results";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
