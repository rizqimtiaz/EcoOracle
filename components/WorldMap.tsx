"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CarbonParcel } from "@/lib/types";
import { classFor, ecosystemLabel, formatHectares, formatTonnes, formatUsd } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * Self-contained world map using equirectangular projection. The continent
 * outlines are simplified rectangles that give the user a sense of geography
 * without depending on any external GeoJSON. Markers are clickable.
 */

interface Props {
  parcels: CarbonParcel[];
  selectedId?: string | null;
  onSelect?: (parcel: CarbonParcel | null) => void;
  height?: number;
}

const W = 1000;
const H = 500;

// Equirectangular projection helpers.
function project(lat: number, lng: number) {
  const x = ((lng + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return { x, y };
}

// Simplified continent silhouettes (paths in equirectangular space). These are
// hand-tuned approximations — small enough to inline yet recognizable.
const CONTINENTS: { name: string; d: string }[] = [
  // North America
  {
    name: "north_america",
    d:
      "M120 90 L250 65 L320 90 L355 130 L370 175 L335 220 L300 235 L265 220 L240 240 L215 270 L190 275 L165 240 L140 215 L120 175 Z",
  },
  // Central America
  {
    name: "central_america",
    d: "M260 245 L290 250 L300 270 L280 285 L265 270 Z",
  },
  // South America
  {
    name: "south_america",
    d:
      "M295 285 L335 290 L355 320 L355 365 L340 410 L315 440 L290 420 L280 380 L290 335 L290 305 Z",
  },
  // Europe
  {
    name: "europe",
    d: "M470 110 L555 95 L595 120 L585 150 L560 165 L520 165 L490 145 Z",
  },
  // Africa
  {
    name: "africa",
    d:
      "M495 175 L575 165 L615 200 L620 250 L595 305 L555 345 L520 350 L490 320 L478 270 L482 215 Z",
  },
  // Asia
  {
    name: "asia",
    d: "M580 95 L800 75 L860 110 L880 165 L840 200 L780 215 L720 220 L675 195 L630 175 L595 145 Z",
  },
  // SE Asia / Indonesia
  {
    name: "sea",
    d: "M780 220 L835 230 L850 245 L820 255 L790 250 Z",
  },
  // Australia
  {
    name: "australia",
    d: "M820 320 L890 310 L915 340 L900 375 L860 380 L825 360 Z",
  },
  // New Zealand
  {
    name: "nz",
    d: "M935 380 L955 385 L955 410 L935 410 Z",
  },
  // Greenland
  {
    name: "greenland",
    d: "M390 50 L440 45 L455 80 L425 105 L395 95 Z",
  },
  // Antarctica (sliver)
  {
    name: "antarctica",
    d: "M40 470 L960 470 L960 500 L40 500 Z",
  },
];

export function WorldMap({ parcels, selectedId, onSelect, height = 540 }: Props) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const selected = useMemo(
    () => parcels.find((p) => p.id === selectedId) ?? null,
    [parcels, selectedId],
  );

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-bg-line bg-[radial-gradient(circle_at_30%_20%,rgba(46,241,145,0.06),transparent_60%)] bg-bg-card"
      style={{ height }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="oceanFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0a1117" />
            <stop offset="100%" stopColor="#05090c" />
          </linearGradient>
          <linearGradient id="landFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0e161e" />
            <stop offset="100%" stopColor="#111c25" />
          </linearGradient>
          <radialGradient id="markerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(46,241,145,0.85)" />
            <stop offset="100%" stopColor="rgba(46,241,145,0)" />
          </radialGradient>
        </defs>

        <rect width={W} height={H} fill="url(#oceanFill)" />

        {/* Latitude / longitude grid */}
        <g stroke="rgba(46,241,145,0.07)" strokeWidth="0.5">
          {[-60, -30, 0, 30, 60].map((lat) => {
            const y = ((90 - lat) / 180) * H;
            return <line key={`lat-${lat}`} x1={0} y1={y} x2={W} y2={y} />;
          })}
          {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lng) => {
            const x = ((lng + 180) / 360) * W;
            return <line key={`lng-${lng}`} x1={x} y1={0} x2={x} y2={H} />;
          })}
        </g>

        {/* Continents */}
        <g fill="url(#landFill)" stroke="rgba(46,241,145,0.18)" strokeWidth="0.7">
          {CONTINENTS.map((c) => (
            <path key={c.name} d={c.d} />
          ))}
        </g>

        {/* Equator highlight */}
        <line
          x1={0}
          x2={W}
          y1={H / 2}
          y2={H / 2}
          stroke="rgba(46,241,145,0.18)"
          strokeDasharray="2 6"
          strokeWidth="0.6"
        />

        {/* Markers */}
        {parcels.map((p) => {
          const { x, y } = project(p.center.lat, p.center.lng);
          const c = classFor(p.status);
          const isSelected = selectedId === p.id;
          const isHover = hoverId === p.id;
          const r = isSelected ? 9 : isHover ? 8 : 6;
          const color =
            p.status === "active"
              ? "#2ef191"
              : p.status === "warning"
                ? "#ffb454"
                : p.status === "invalidated"
                  ? "#ff6c6c"
                  : p.status === "regenerating"
                    ? "#3eb3ff"
                    : "#ffffff";
          return (
            <g
              key={p.id}
              transform={`translate(${x}, ${y})`}
              className="cursor-pointer"
              onMouseEnter={() => setHoverId(p.id)}
              onMouseLeave={() => setHoverId(null)}
              onClick={() => onSelect?.(p)}
            >
              {(isSelected || isHover) && (
                <circle r={20} fill="url(#markerGlow)" />
              )}
              <circle r={r + 4} fill={color} opacity="0.18">
                <animate
                  attributeName="r"
                  values={`${r + 4};${r + 12};${r + 4}`}
                  dur="2.6s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.25;0;0.25"
                  dur="2.6s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle r={r} fill={color} opacity="0.95" />
              <circle r={r - 2.5} fill="#05090c" />
              <circle r={r - 4} fill={color} />
              {(isSelected || isHover) && (
                <text
                  x={r + 8}
                  y={4}
                  className="pointer-events-none fill-white text-[11px] font-medium"
                  style={{ textShadow: "0 0 4px rgba(0,0,0,0.8)" }}
                >
                  {p.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating panel for the selected parcel */}
      {selected && (
        <div className="pointer-events-auto absolute bottom-4 left-4 right-4 z-10 grid gap-3 rounded-xl border border-bg-line bg-bg-card/95 p-4 shadow-card backdrop-blur-md md:max-w-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-white/45">
                {ecosystemLabel(selected.ecosystem)} · #{selected.tokenId}
              </div>
              <h4 className="mt-0.5 text-base font-semibold text-white">
                {selected.name}
              </h4>
              <p className="text-xs text-white/55">{selected.region}</p>
            </div>
            <button
              type="button"
              className="text-white/40 hover:text-white"
              onClick={() => onSelect?.(null)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Cell label="Hectares" value={formatHectares(selected.hectares)} />
            <Cell label="Verified CO₂e" value={formatTonnes(selected.currentTonnesCO2)} />
            <Cell label="Credits" value={selected.creditsOutstanding.toLocaleString()} />
            <Cell label="Price / credit" value={formatUsd(selected.pricePerCredit)} />
          </div>
          <div className="flex items-center justify-between">
            <span
              className={cn("badge", classFor(selected.status).bg, classFor(selected.status).text, classFor(selected.status).ring)}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", classFor(selected.status).dot)} />
              {classFor(selected.status).label}
            </span>
            <Link
              href={`/marketplace/${selected.tokenId}`}
              className="text-xs font-medium text-eco-300 hover:text-eco-200"
            >
              Open dNFT →
            </Link>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute right-3 top-3 flex flex-col gap-1.5 rounded-lg border border-bg-line bg-bg-card/85 p-2.5 text-[11px] backdrop-blur">
        <Legend dot="#2ef191" label="Active" />
        <Legend dot="#3eb3ff" label="Regenerating" />
        <Legend dot="#ffb454" label="Warning" />
        <Legend dot="#ff6c6c" label="Invalidated" />
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-bg-line bg-bg-soft/60 p-2">
      <div className="text-[10px] uppercase tracking-wider text-white/40">
        {label}
      </div>
      <div className="font-medium text-white/90 tabular-nums">{value}</div>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
      <span className="text-white/70">{label}</span>
    </div>
  );
}
