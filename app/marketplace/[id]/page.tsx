import { notFound } from "next/navigation";
import { readState } from "@/lib/db";
import { SectionHeader } from "@/components/SectionHeader";
import { StatusPill } from "@/components/StatusPill";
import { ParcelMap } from "@/components/ParcelMap";
import { ScanTimelineChart } from "@/components/charts/ScanTimelineChart";
import { CreditsTimelineChart } from "@/components/charts/CreditsTimelineChart";
import { EventLog } from "@/components/EventLog";
import { TradePanel } from "@/components/TradePanel";
import { ParcelAnalyzePanel } from "@/components/ParcelAnalyzePanel";
import {
  ecosystemLabel,
  formatHectares,
  formatNumber,
  formatPct,
  formatTonnes,
  formatUsd,
  shortHash,
  timeAgo,
} from "@/lib/format";
import {
  ArrowLeft,
  Coins,
  Cpu,
  Globe2,
  Hash,
  MapPin,
  Recycle,
  Scale,
  TreePine,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default function ParcelDetailPage({ params }: Props) {
  const state = readState();
  const parcel = state.parcels.find(
    (p) => p.id === params.id || String(p.tokenId) === params.id,
  );
  if (!parcel) notFound();
  const events = state.events.filter((e) => e.parcelId === parcel.id).slice(0, 30);
  const owner = state.portfolios.find((p) => p.address === parcel.owner);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1 text-white/55 hover:text-eco-300"
        >
          <ArrowLeft size={14} />
          Marketplace
        </Link>
        <span className="text-white/30">/</span>
        <span className="font-mono text-white/55">#{parcel.tokenId}</span>
      </div>

      <SectionHeader
        eyebrow={`${ecosystemLabel(parcel.ecosystem)} · dNFT #${parcel.tokenId}`}
        title={parcel.name}
        description={parcel.region}
        actions={
          <>
            <StatusPill status={parcel.status} />
            <span className="badge bg-white/5 text-white/70 ring-white/10">
              <Hash size={12} />
              <span className="font-mono">{parcel.id}</span>
            </span>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <ParcelMap parcel={parcel} />

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KeyMetric icon={<TreePine size={14} />} label="Hectares" value={formatHectares(parcel.hectares)} />
            <KeyMetric icon={<Cpu size={14} />} label="Verified CO₂e" value={formatTonnes(parcel.currentTonnesCO2)} />
            <KeyMetric icon={<Coins size={14} />} label="Credits" value={formatNumber(parcel.creditsOutstanding)} />
            <KeyMetric icon={<Scale size={14} />} label="Price / credit" value={formatUsd(parcel.pricePerCredit)} accent />
          </div>

          <div className="panel p-6">
            <div className="mb-4 flex items-baseline justify-between">
              <div>
                <h3 className="text-base font-semibold">Verified CO₂e history</h3>
                <p className="text-xs text-white/50">
                  Cumulative tonnes per AI-verified scan over the last 30 days.
                </p>
              </div>
              <div className="text-right text-xs text-white/45">
                Baseline: {formatTonnes(parcel.baselineTonnesCO2)}
              </div>
            </div>
            <CreditsTimelineChart scans={parcel.scanHistory} />
          </div>

          <div className="panel p-6">
            <div className="mb-4 flex items-baseline justify-between">
              <div>
                <h3 className="text-base font-semibold">Vegetation indices</h3>
                <p className="text-xs text-white/50">
                  Per-band readings from the AI vision model.
                </p>
              </div>
              {parcel.lastScan && (
                <span className="text-xs text-white/45">
                  Confidence {(parcel.lastScan.confidence * 100).toFixed(1)}%
                </span>
              )}
            </div>
            <ScanTimelineChart scans={parcel.scanHistory} />
          </div>

          <div className="panel p-6">
            <h3 className="mb-3 text-base font-semibold">Latest AI report</h3>
            {parcel.lastScan ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  <Indicator label="NDVI" value={formatPct(parcel.lastScan.ndvi)} />
                  <Indicator label="Canopy density" value={formatPct(parcel.lastScan.canopyDensity)} />
                  <Indicator label="Biomass index" value={formatPct(parcel.lastScan.biomassIndex)} />
                  <Indicator label="Soil carbon" value={formatPct(parcel.lastScan.soilCarbonIndex)} />
                  <Indicator label="Moisture" value={formatPct(parcel.lastScan.moistureIndex)} />
                  <Indicator
                    label="Thermal anomaly"
                    value={formatPct(parcel.lastScan.thermalAnomaly)}
                    danger={parcel.lastScan.thermalAnomaly > 0.4}
                  />
                </div>
                <ul className="space-y-1.5 rounded-lg border border-bg-line bg-bg-soft/50 p-3 text-sm">
                  {parcel.lastScan.notes.map((n, i) => (
                    <li key={i} className="flex items-start gap-2 text-white/70">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-eco-400" />
                      {n}
                    </li>
                  ))}
                </ul>
                <div className="text-xs text-white/40">
                  Reported {timeAgo(parcel.lastScan.timestamp)} · classification:{" "}
                  <span className="font-medium text-white/70">{parcel.lastScan.classification}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-white/55">No scans yet.</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <TradePanel parcel={parcel} />
          <ParcelAnalyzePanel parcelId={parcel.id} />

          <div className="panel p-5">
            <h3 className="text-base font-semibold">Provenance</h3>
            <p className="text-xs text-white/55">On-chain identity & ownership.</p>
            <ul className="mt-3 space-y-2 text-sm">
              <Provenance icon={<Globe2 size={14} />} label="GPS center">
                <span className="font-mono text-white/85">
                  {parcel.center.lat.toFixed(5)}°, {parcel.center.lng.toFixed(5)}°
                </span>
              </Provenance>
              <Provenance icon={<MapPin size={14} />} label="Polygon">
                <span className="text-white/70">{parcel.polygon.length} vertices</span>
              </Provenance>
              <Provenance icon={<Hash size={14} />} label="Token ID">
                <span className="font-mono text-white/85">#{parcel.tokenId}</span>
              </Provenance>
              <Provenance icon={<TreePine size={14} />} label="Ecosystem">
                <span className="text-white/85">{ecosystemLabel(parcel.ecosystem)}</span>
              </Provenance>
              <Provenance icon={<Recycle size={14} />} label="Owner">
                <span className="font-mono text-white/85">
                  {owner?.label ?? shortHash(parcel.owner, 8, 6)}
                </span>
              </Provenance>
              <Provenance icon={<Scale size={14} />} label="Created">
                <span className="text-white/85">
                  {new Date(parcel.createdAt).toLocaleDateString()}
                </span>
              </Provenance>
            </ul>
          </div>

          <div className="panel p-5">
            <h3 className="text-base font-semibold">On-chain history</h3>
            <p className="text-xs text-white/55 mb-3">
              Every event for this dNFT, oldest at the bottom.
            </p>
            <EventLog events={events} showParcelLink={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

function KeyMetric({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-white/45">
        <span>{label}</span>
        <span className="text-eco-300/80">{icon}</span>
      </div>
      <div
        className={
          "mt-1 text-xl font-semibold tabular-nums " +
          (accent ? "text-eco-300" : "text-white")
        }
      >
        {value}
      </div>
    </div>
  );
}

function Indicator({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-lg border border-bg-line bg-bg-soft/50 p-3">
      <div className="text-[10px] uppercase tracking-wider text-white/45">
        {label}
      </div>
      <div className={"mt-0.5 text-base font-semibold tabular-nums " + (danger ? "text-danger-400" : "text-white/90")}>
        {value}
      </div>
    </div>
  );
}

function Provenance({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-bg-line/50 py-1.5 last:border-0">
      <span className="flex items-center gap-2 text-xs text-white/55">
        <span className="text-eco-300/80">{icon}</span>
        {label}
      </span>
      <span className="text-right text-sm">{children}</span>
    </li>
  );
}
