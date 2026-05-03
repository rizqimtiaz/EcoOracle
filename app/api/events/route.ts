import { NextRequest, NextResponse } from "next/server";
import { readState } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const state = readState();
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") ?? "100", 10);
  const kind = url.searchParams.get("kind");
  const events = (kind ? state.events.filter((e) => e.kind === kind) : state.events)
    .slice(0, isNaN(limit) ? 100 : Math.max(1, Math.min(500, limit)));
  return NextResponse.json({ events });
}
