import { NextRequest, NextResponse } from "next/server";
import { readState } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const state = readState();
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") ?? "100", 10);
  return NextResponse.json({
    transactions: state.transactions.slice(0, Math.max(1, Math.min(500, limit))),
  });
}
