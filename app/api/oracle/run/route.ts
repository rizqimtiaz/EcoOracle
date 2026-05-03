import { NextResponse } from "next/server";
import { withState } from "@/lib/db";
import { runOracleNetwork } from "@/lib/oracle";

export const dynamic = "force-dynamic";

export async function POST() {
  const results = await withState((state) => runOracleNetwork(state));
  return NextResponse.json({
    scans: results.length,
    mutated: results.filter((r) => r.mutated).length,
    results: results.map((r) => ({
      parcelId: r.parcelId,
      classification: r.scan.classification,
      tonnesCO2: r.scan.estimatedTonnesCO2,
      delta: r.scan.deltaTonnesCO2,
      events: r.events.map((e) => ({
        kind: e.kind,
        message: e.message,
        txHash: e.txHash,
      })),
    })),
  });
}
