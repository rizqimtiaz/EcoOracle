import Link from "next/link";
import { CarbonParcel } from "@/lib/types";
import { StatusPill } from "./StatusPill";
import {
  ecosystemLabel,
  formatHectares,
  formatNumber,
  formatPct,
  formatTonnes,
  formatUsd,
  timeAgo,
} from "@/lib/format";
import { Trees, Activity } from "lucide-react";

interface Props {
  parcel: CarbonParcel;
}

export function ParcelCard({ parcel }: Props) {
  const lastScan = parcel.lastScan;
  return (
    <Link
      href={`/marketplace/${parcel.tokenId}`}
      className="group panel relative overflow-hidden p-5 transition-colors hover:border-eco-700/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-eco-500/10 text-eco-300 ring-1 ring-eco-500/20">
            <Trees size={16} />
          </span>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/45">
              {ecosystemLabel(parcel.ecosystem)} · #{parcel.tokenId}
            </div>
            <div className="mt-0.5 text-base font-semibold text-white">
              {parcel.name}
            </div>
            <div className="text-xs text-white/55">{parcel.region}</div>
          </div>
        </div>
        <StatusPill status={parcel.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <Row label="Hectares" value={formatHectares(parcel.hectares)} />
        <Row label="Verified CO₂e" value={formatTonnes(parcel.currentTonnesCO2)} />
        <Row
          label="Credits available"
          value={formatNumber(parcel.creditsOutstanding)}
        />
        <Row
          label="Price / credit"
          value={formatUsd(parcel.pricePerCredit)}
          accent
        />
      </div>

      {lastScan && (
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-bg-line bg-bg-soft/40 p-3 text-[11px]">
          <Mini label="NDVI" value={lastScan.ndvi.toFixed(2)} />
          <Mini label="Canopy" value={formatPct(lastScan.canopyDensity)} />
          <Mini label="Biomass" value={formatPct(lastScan.biomassIndex)} />
        </div>
      )}

      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-white/45">
        <Activity size={11} className="text-eco-400" />
        Last AI scan {lastScan ? timeAgo(lastScan.timestamp) : "—"}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-eco-400 to-transparent transition-transform duration-500 group-hover:scale-x-100" />
    </Link>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-white/40">
        {label}
      </div>
      <div
        className={
          "tabular-nums " + (accent ? "font-semibold text-eco-300" : "text-white/85")
        }
      >
        {value}
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-[10px] uppercase tracking-wider text-white/40">
        {label}
      </div>
      <div className="font-mono tabular-nums text-white/85">{value}</div>
    </div>
  );
}
