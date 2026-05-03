import { NextRequest, NextResponse } from "next/server";
import { readState } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const state = readState();
  const parcel = state.parcels.find((p) => p.id === params.id || String(p.tokenId) === params.id);
  if (!parcel) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const events = state.events.filter((e) => e.parcelId === parcel.id).slice(0, 40);
  const txs = state.transactions
    .filter((t) =>
      t.method === "mintCarbonCredit"
        ? t.args.tokenId === parcel.tokenId
        : t.args.tokenId === parcel.tokenId,
    )
    .slice(0, 40);
  return NextResponse.json({ parcel, events, transactions: txs });
}
