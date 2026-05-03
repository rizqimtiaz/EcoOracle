import { NextResponse } from "next/server";
import { readState } from "@/lib/db";
import { computeStats, networkTimeseries, totalsByEcosystem } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = readState();
  return NextResponse.json({
    stats: computeStats(state),
    parcels: state.parcels,
    portfolios: state.portfolios,
    events: state.events.slice(0, 50),
    transactions: state.transactions.slice(0, 50),
    ecosystems: totalsByEcosystem(state),
    timeseries: networkTimeseries(state, 30),
    blockHeight: state.blockHeight,
    lastBlockTimestamp: state.lastBlockTimestamp,
  });
}
