"use client";

import { useEffect, useMemo, useState } from "react";
import { CarbonParcel } from "@/lib/types";
import { SectionHeader } from "@/components/SectionHeader";
import { ParcelCard } from "@/components/ParcelCard";
import { Search } from "lucide-react";

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "regenerating", label: "Regenerating" },
  { id: "warning", label: "Warning" },
  { id: "invalidated", label: "Invalidated" },
];

const SORT_OPTIONS = [
  { id: "tonnes", label: "Verified CO₂e" },
  { id: "credits", label: "Credits available" },
  { id: "price", label: "Price (low → high)" },
  { id: "price_desc", label: "Price (high → low)" },
  { id: "newest", label: "Newest" },
];

const ECOSYSTEMS = [
  "all",
  "tropical_rainforest",
  "temperate_forest",
  "boreal_forest",
  "mangrove",
  "peatland",
  "savanna",
  "wetland",
  "agroforestry",
];

export default function MarketplacePage() {
  const [parcels, setParcels] = useState<CarbonParcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [ecosystem, setEcosystem] = useState("all");
  const [sort, setSort] = useState("tonnes");

  useEffect(() => {
    fetch("/api/parcels")
      .then((r) => r.json())
      .then((d) => {
        setParcels(d.parcels);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    let out = parcels.filter((p) => {
      const q = search.trim().toLowerCase();
      if (q && !`${p.name} ${p.region} ${p.ecosystem}`.toLowerCase().includes(q)) return false;
      if (status !== "all" && p.status !== status) return false;
      if (ecosystem !== "all" && p.ecosystem !== ecosystem) return false;
      return true;
    });
    out = out.slice().sort((a, b) => {
      switch (sort) {
        case "credits":
          return b.creditsOutstanding - a.creditsOutstanding;
        case "price":
          return a.pricePerCredit - b.pricePerCredit;
        case "price_desc":
          return b.pricePerCredit - a.pricePerCredit;
        case "newest":
          return b.createdAt - a.createdAt;
        case "tonnes":
        default:
          return b.currentTonnesCO2 - a.currentTonnesCO2;
      }
    });
    return out;
  }, [parcels, search, status, ecosystem, sort]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Marketplace"
        title="Carbon credit dNFTs"
        description="Browse the full catalogue of GPS-anchored parcels. Each card represents a single dynamic NFT — its credits, price, and status update automatically as the AI verifies new scans."
      />

      <div className="panel grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
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
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-bg-line bg-bg-soft px-3 py-2 text-sm focus:border-eco-700 focus:outline-none"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s.id} value={s.id}>
              Status: {s.label}
            </option>
          ))}
        </select>
        <select
          value={ecosystem}
          onChange={(e) => setEcosystem(e.target.value)}
          className="rounded-lg border border-bg-line bg-bg-soft px-3 py-2 text-sm focus:border-eco-700 focus:outline-none"
        >
          {ECOSYSTEMS.map((e) => (
            <option key={e} value={e}>
              Ecosystem: {e === "all" ? "All" : e.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg border border-bg-line bg-bg-soft px-3 py-2 text-sm focus:border-eco-700 focus:outline-none"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              Sort: {s.label}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="panel shimmer h-52 animate-pulse-soft"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="panel flex h-40 items-center justify-center text-white/55">
          No parcels match your filters.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <ParcelCard key={p.id} parcel={p} />
        ))}
      </div>
    </div>
  );
}
