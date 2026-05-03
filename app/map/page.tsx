"use client";

import { useEffect, useMemo, useState } from "react";
import { CarbonParcel } from "@/lib/types";
import { WorldMap } from "@/components/WorldMap";
import { SectionHeader } from "@/components/SectionHeader";
import { StatusPill } from "@/components/StatusPill";
import {
  formatHectares,
  formatNumber,
  formatPct,
  formatTonnes,
  formatUsd,
  ecosystemLabel,
  timeAgo,
} from "@/lib/format";
import Link from "next/link";
import { Search, MapPin, Trees, ArrowRight } from "lucide-react";

export default function MapPage() {
  const [parcels, setParcels] = useState<CarbonParcel[]>([]);
  const [selected, setSelected] = useState<CarbonParcel | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/parcels")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setParcels(d.parcels);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return parcels.filter((p) => {
      const q = filter.trim().toLowerCase();
      if (q && !`${p.name} ${p.region} ${p.ecosystem}`.toLowerCase().includes(q)) {
        return false;
      }
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      return true;
    });
  }, [parcels, filter, statusFilter]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Live Map"
        title="Global carbon parcels"
        description="Every dot is a GPS-anchored dNFT. Click for details, or open the parcel to inspect its full satellite history."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <WorldMap
            parcels={filtered}
            selectedId={selected?.id}
            onSelect={(p) => setSelected(p)}
            height={560}
          />
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/55">
            <MapPin size={12} className="text-eco-400" />
            Coordinates accurate to ±0.0000001° on chain. Polygons stored per dNFT.
          </div>
        </div>

        <div className="panel flex flex-col p-0">
          <div className="border-b border-bg-line/60 p-4">
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/45"
              />
              <input
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search by name, region, ecosystem…"
                className="w-full rounded-lg border border-bg-line bg-bg-soft py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/40 focus:border-eco-700 focus:outline-none"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[
                { id: "all", label: "All" },
                { id: "active", label: "Active" },
                { id: "warning", label: "Warning" },
                { id: "regenerating", label: "Regenerating" },
                { id: "invalidated", label: "Invalidated" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatusFilter(s.id)}
                  className={
                    "rounded-full border px-2.5 py-1 text-[11px] transition-colors " +
                    (statusFilter === s.id
                      ? "border-eco-700/60 bg-eco-500/15 text-eco-300"
                      : "border-bg-line text-white/60 hover:bg-white/5")
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[460px] flex-1 overflow-y-auto">
            {loading && (
              <div className="flex h-40 items-center justify-center text-sm text-white/45">
                Loading parcels…
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="flex h-40 items-center justify-center text-sm text-white/45">
                No parcels match your filters.
              </div>
            )}
            <ul className="divide-y divide-bg-line/60">
              {filtered.map((p) => {
                const lastScan = p.lastScan;
                const isSelected = selected?.id === p.id;
                return (
                  <li
                    key={p.id}
                    className={
                      "flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors " +
                      (isSelected ? "bg-eco-500/[0.05]" : "hover:bg-white/[0.02]")
                    }
                    onClick={() => setSelected(p)}
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
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-white/45">
                        <span>{ecosystemLabel(p.ecosystem)}</span>
                        <span>·</span>
                        <span>{formatHectares(p.hectares)}</span>
                        <span>·</span>
                        <span className="tabular-nums">
                          {formatTonnes(p.currentTonnesCO2)}
                        </span>
                        <span>·</span>
                        <span className="tabular-nums">{formatUsd(p.pricePerCredit)}</span>
                      </div>
                      {lastScan && (
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-white/35">
                          <span>NDVI {lastScan.ndvi.toFixed(2)}</span>
                          <span>·</span>
                          <span>Canopy {formatPct(lastScan.canopyDensity)}</span>
                          <span>·</span>
                          <span>{timeAgo(lastScan.timestamp)}</span>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="border-t border-bg-line/60 p-3">
            <div className="flex items-center justify-between text-xs text-white/45">
              <span>
                {filtered.length} of {parcels.length} parcels ·{" "}
                {formatNumber(
                  filtered.reduce((s, p) => s + p.creditsOutstanding, 0),
                )}{" "}
                credits
              </span>
              {selected && (
                <Link
                  href={`/marketplace/${selected.tokenId}`}
                  className="inline-flex items-center gap-1 font-medium text-eco-300 hover:text-eco-200"
                >
                  Open #{selected.tokenId}
                  <ArrowRight size={12} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
