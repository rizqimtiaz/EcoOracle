import { NextRequest, NextResponse } from "next/server";
import { withState } from "@/lib/db";
import { runOracleOnce } from "@/lib/oracle";
import type { ScanEvent } from "@/lib/ai-vision";

export const dynamic = "force-dynamic";

interface Body {
  parcelId: string;
  forceEvent?: ScanEvent["kind"];
  magnitude?: number;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body.parcelId) {
    return NextResponse.json({ error: "parcelId required" }, { status: 400 });
  }

  let forced: ScanEvent | undefined;
  if (body.forceEvent && body.forceEvent !== "normal") {
    const m = clamp01(body.magnitude ?? 0.55);
    if (body.forceEvent === "growth") forced = { kind: "growth", magnitude: m };
    else if (body.forceEvent === "deforestation") forced = { kind: "deforestation", magnitude: m };
    else if (body.forceEvent === "fire") forced = { kind: "fire", magnitude: m };
    else if (body.forceEvent === "regeneration") forced = { kind: "regeneration", magnitude: m };
  }

  const result = await withState((state) => {
    const parcel = state.parcels.find((p) => p.id === body.parcelId);
    if (!parcel) return null;
    return runOracleOnce({ state, parcel, forcedEvent: forced });
  });

  if (!result) {
    return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}

function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}
