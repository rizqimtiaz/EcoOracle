"use client";

import { ecosystemLabel } from "@/lib/format";

interface Datum {
  ecosystem: string;
  hectares: number;
  tonnesCO2: number;
  parcels: number;
}

const COLORS: Record<string, string> = {
  tropical_rainforest: "#2ef191",
  mangrove: "#3eb3ff",
  peatland: "#a4ffd0",
  boreal_forest: "#67ffb1",
  temperate_forest: "#0ed373",
  savanna: "#ffb454",
  wetland: "#0c92ff",
  agroforestry: "#d2ffe7",
};

export function EcosystemBars({ data }: { data: Datum[] }) {
  const max = Math.max(...data.map((d) => d.tonnesCO2), 1);
  return (
    <div className="space-y-3">
      {data
        .sort((a, b) => b.tonnesCO2 - a.tonnesCO2)
        .map((d) => (
          <div key={d.ecosystem}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-white/70">{ecosystemLabel(d.ecosystem)}</span>
              <span className="font-mono tabular-nums text-white/60">
                {d.tonnesCO2.toLocaleString()} t · {d.parcels} parcel
                {d.parcels === 1 ? "" : "s"}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-bg-line/60">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(d.tonnesCO2 / max) * 100}%`,
                  background: `linear-gradient(90deg, ${COLORS[d.ecosystem] ?? "#2ef191"}, ${COLORS[d.ecosystem] ?? "#2ef191"}80)`,
                }}
              />
            </div>
          </div>
        ))}
    </div>
  );
}
