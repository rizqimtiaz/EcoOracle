import { NextResponse } from "next/server";
import { readState } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = readState();
  return NextResponse.json({ parcels: state.parcels });
}
