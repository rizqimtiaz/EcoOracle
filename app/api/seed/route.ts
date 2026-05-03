import { NextResponse } from "next/server";
import { seedNetwork } from "@/lib/seed";

export const dynamic = "force-dynamic";

/**
 * Re-seeds the demo data in-process. Called by the "Reset Network" button.
 */
export async function POST() {
  try {
    const r = await seedNetwork();
    return NextResponse.json({ ok: true, ...r });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Seed failed." },
      { status: 500 },
    );
  }
}
