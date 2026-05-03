"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CarbonParcel, OracleEvent, SatelliteScanReport } from "@/lib/types";
import { SectionHeader } from "@/components/SectionHeader";
import { ParcelMap } from "@/components/ParcelMap";
import { StatusPill } from "@/components/StatusPill";
import {
  ecosystemLabel,
  formatHectares,
  formatNumber,
  formatPct,
  formatTonnes,
  shortHash,
  timeAgo,
} from "@/lib/format";
import { cn } from "@/lib/cn";
import {
  Sparkles,
  Loader2,
  Sprout,
  Trees,
  Flame,
  Recycle,
  ArrowRight,
  ScanLine,
  Search,
  Cpu,
} from "lucide-react";

type EventKind = "normal" | "growth" | "deforestation" | "fire" | "regeneration";

const PRESETS: { id: EventKind; label: string; description: string; icon: React.ElementType; tone: string }[] = [
  { id: "normal", label: "Routine scan", description: "Baseline + small noise. No anomalies forced.", icon: Sparkles, tone: "text-white/70" },
  { id: "growth", label: "Healthy growth", description: "NDVI & biomass climb. Credits issued.", icon: Sprout, tone: "text-eco-300" },
  { id: "deforestation", label: "Deforestation", description: "Canopy loss simulated. Partial burn of credits.", icon: Trees, tone: "text-warn-400" },
  { id: "fire", label: "Wildfire", description: "Heavy burn. dNFT typically invalidated.", icon: Flame, tone: "text-danger-400" },
  { id: "regeneration", label: "Regeneration", description: "Recovery signal post-event. Credits re-issued.", icon: Recycle, tone: "text-ocean-400" },
];

export default function AnalyzePage() {
  const router = useRouter();
  const [parcels, setParcels] = useState<CarbonParcel[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [forceEvent, setForceEvent] = useState<EventKind>("normal");
  const [magnitude, setMagnitude] = useState(0.55);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ scan: SatelliteScanReport; events: OracleEvent[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/parcels")
      .then((r) => r.json())
      .then((d) => {
        setParcels(d.parcels);
        if (d.parcels.length > 0) setSelectedId(d.parcels[0].id);
      });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return parcels;
    return parcels.filter((p) =>
      `${p.name} ${p.region} ${p.ecosystem}`.toLowerCase().includes(q),
    );
  }, [parcels, search]);

  const selected = parcels.find((p) => p.id === selectedId);

  async function run() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setScanning(true);
    // Simulate a brief scan animation.
    await new Promise((r) => setTimeout(r, 1100));
    setScanning(false);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parcelId: selected.id,
          forceEvent,
          magnitude,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Scan failed.");
      } else {
        setResult(json);
        router.refresh();
        // Refetch the parcel to get up-to-date state.
        fetch("/api/parcels")
          .then((r) => r.json())
          .then((d) => setParcels(d.parcels));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="AI Vision Engine"
        title="Live satellite analysis"
        description="Pick any parcel, choose a scenario, and watch the AI vision pipeline produce a verified report — then watch the oracle push it on-chain."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        {/* Left rail: parcel selector */}
        <div className="panel flex flex-col p-0">
          <div className="border-b border-bg-line/60 p-4">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/45" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search parcels…"
                className="w-full rounded-lg border border-bg-line bg-bg-soft py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/40 focus:border-eco-700 focus:outline-none"
              />
            </div>
          </div>
          <div className="max-h-[520px] overflow-y-auto">
            <ul className="divide-y divide-bg-line/60">
              {filtered.map((p) => (
                <li
                  key={p.id}
                  onClick={() => {
                    setSelectedId(p.id);
                    setResult(null);
                  }}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors",
                    selectedId === p.id
                      ? "bg-eco-500/[0.07]"
                      : "hover:bg-white/[0.02]",
                  )}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-eco-500/10 text-eco-300 ring-1 ring-eco-500/20">
                    <Trees size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium text-white">
                        {p.name}
                      </span>
                      <StatusPill status={p.status} className="!py-0.5" />
                    </div>
                    <div className="text-xs text-white/55">{p.region}</div>
                    <div className="mt-0.5 text-[11px] text-white/40">
                      #{p.tokenId} · {ecosystemLabel(p.ecosystem)} · {formatHectares(p.hectares)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right pane: live scan */}
        <div className="space-y-4">
          {selected ? (
            <>
              <div className="relative">
                <ParcelMap parcel={selected} />
                {scanning && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="absolute inset-0 overflow-hidden rounded-2xl">
                      <div className="absolute inset-x-0 -top-12 h-24 animate-scan bg-gradient-to-b from-transparent via-eco-400/40 to-transparent" />
                    </div>
                    <div className="rounded-full border border-eco-700/60 bg-bg/85 px-4 py-1.5 text-xs font-medium text-eco-300 backdrop-blur">
                      <ScanLine size={12} className="mr-2 inline" />
                      Vision pipeline running…
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Mini label="Token" value={`#${selected.tokenId}`} />
                <Mini label="Hectares" value={formatHectares(selected.hectares)} />
                <Mini label="Verified CO₂e" value={formatTonnes(selected.currentTonnesCO2)} />
                <Mini label="Credits" value={formatNumber(selected.creditsOutstanding)} />
              </div>

              <div className="panel p-5">
                <h3 className="mb-3 text-base font-semibold">Scenario</h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {PRESETS.map((p) => {
                    const Icon = p.icon;
                    const active = forceEvent === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setForceEvent(p.id)}
                        className={cn(
                          "flex h-full flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors",
                          active
                            ? "border-eco-700/60 bg-eco-500/10"
                            : "border-bg-line bg-bg-soft/40 hover:bg-white/[0.03]",
                        )}
                      >
                        <Icon size={16} className={p.tone} />
                        <span className="text-sm font-medium text-white">
                          {p.label}
                        </span>
                        <span className="text-[11px] leading-snug text-white/55">
                          {p.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {forceEvent !== "normal" && (
                  <div className="mt-4">
                    <label className="mb-1 flex items-center justify-between text-xs text-white/55">
                      <span>Magnitude</span>
                      <span className="font-mono text-white/70">
                        {(magnitude * 100).toFixed(0)}%
                      </span>
                    </label>
                    <input
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={magnitude}
                      onChange={(e) => setMagnitude(parseFloat(e.target.value))}
                      className="w-full accent-eco-500"
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={run}
                  disabled={busy}
                  className="btn-primary mt-4 w-full justify-center"
                >
                  {busy ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                  Run vision pipeline + push to chain
                </button>
                {error && (
                  <div className="mt-3 rounded-lg border border-danger-600/40 bg-danger-500/10 px-3 py-2 text-xs text-danger-400">
                    {error}
                  </div>
                )}
              </div>

              {result && (
                <div className="panel p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-base font-semibold">Vision report</h3>
                    <span className="text-xs text-white/45">
                      Confidence {(result.scan.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    <Indicator label="NDVI" value={formatPct(result.scan.ndvi)} />
                    <Indicator label="Canopy" value={formatPct(result.scan.canopyDensity)} />
                    <Indicator label="Biomass" value={formatPct(result.scan.biomassIndex)} />
                    <Indicator label="Soil carbon" value={formatPct(result.scan.soilCarbonIndex)} />
                    <Indicator label="Moisture" value={formatPct(result.scan.moistureIndex)} />
                    <Indicator
                      label="Thermal anomaly"
                      value={formatPct(result.scan.thermalAnomaly)}
                      danger={result.scan.thermalAnomaly > 0.4}
                    />
                  </div>
                  <ul className="mt-4 space-y-1 rounded-lg border border-bg-line bg-bg-soft/50 p-3 text-sm">
                    {result.scan.notes.map((n, i) => (
                      <li key={i} className="flex items-start gap-2 text-white/70">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-eco-400" />
                        {n}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 grid gap-2">
                    {result.events.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-start gap-3 rounded-lg border border-eco-700/30 bg-eco-500/5 p-3 text-xs"
                      >
                        <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-eco-500/15 text-eco-300 ring-1 ring-eco-500/30">
                          <Cpu size={12} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-eco-300">
                            {e.kind} on-chain at block {e.blockNumber.toLocaleString()}
                          </div>
                          <div className="text-white/70">{e.message}</div>
                          <div className="mt-1 font-mono text-[11px] text-white/30">
                            tx {shortHash(e.txHash, 12, 10)} · {timeAgo(e.timestamp)}
                          </div>
                        </div>
                        <a
                          href={`/marketplace/${e.tokenId}`}
                          className="self-center text-eco-300 hover:text-eco-200"
                        >
                          <ArrowRight size={14} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="panel flex h-96 items-center justify-center text-sm text-white/55">
              Select a parcel to begin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-3">
      <div className="text-[10px] uppercase tracking-wider text-white/45">
        {label}
      </div>
      <div className="font-medium tabular-nums text-white/90">{value}</div>
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
      <div
        className={
          "mt-0.5 text-base font-semibold tabular-nums " +
          (danger ? "text-danger-400" : "text-white/90")
        }
      >
        {value}
      </div>
    </div>
  );
}
