import { NextRequest, NextResponse } from "next/server";
import { withState } from "@/lib/db";
import { chainTransfer, chainRetire } from "@/lib/chain";

export const dynamic = "force-dynamic";

interface Body {
  action: "buy" | "retire";
  tokenId: number;
  buyerAddress: string;
  credits: number;
  beneficiary?: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body.action || !body.tokenId || !body.buyerAddress || !body.credits) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  try {
    const result = await withState((state) => {
      const parcel = state.parcels.find((p) => p.tokenId === body.tokenId);
      if (!parcel) throw new Error("Parcel not found.");
      if (parcel.status === "invalidated") {
        throw new Error("Cannot trade invalidated credits.");
      }

      if (body.action === "buy") {
        const buyer = state.portfolios.find((p) => p.address === body.buyerAddress);
        if (!buyer) throw new Error("Buyer wallet not registered.");
        const seller = state.portfolios.find((p) => p.address === parcel.owner);
        if (!seller) throw new Error("Seller wallet not registered.");
        return chainTransfer(state, parcel, seller.address, buyer.address, body.credits);
      }
      if (body.action === "retire") {
        const buyer = state.portfolios.find((p) => p.address === body.buyerAddress);
        if (!buyer) throw new Error("Wallet not registered.");
        return chainRetire(
          state,
          parcel,
          buyer.address,
          body.credits,
          body.beneficiary ?? buyer.label,
        );
      }
      throw new Error("Unsupported action.");
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Trade failed." },
      { status: 400 },
    );
  }
}
