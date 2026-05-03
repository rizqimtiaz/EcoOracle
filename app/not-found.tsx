import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-bg-line bg-bg-card">
        <MapPin className="text-eco-300" size={28} />
      </div>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          That parcel isn't on our map.
        </h1>
        <p className="mt-2 max-w-md text-white/55">
          The page or token you were looking for doesn't exist in the EcoOracle
          network. It may have been retired, invalidated, or never minted.
        </p>
      </div>
      <Link href="/" className="btn-primary">
        <ArrowLeft size={14} />
        Return home
      </Link>
    </div>
  );
}
