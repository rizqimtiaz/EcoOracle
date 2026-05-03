"use client";

import { CarbonParcel } from "@/lib/types";

/**
 * A small SVG map showing the parcel polygon overlaid on a stylized
 * satellite-style raster. Pure SVG — no external tile dependency.
 */
export function ParcelMap({ parcel }: { parcel: CarbonParcel }) {
  const { polygon, center, status } = parcel;
  const minLat = Math.min(...polygon.map((p) => p.lat));
  const maxLat = Math.max(...polygon.map((p) => p.lat));
  const minLng = Math.min(...polygon.map((p) => p.lng));
  const maxLng = Math.max(...polygon.map((p) => p.lng));
  const padLat = (maxLat - minLat) * 0.6 + 0.005;
  const padLng = (maxLng - minLng) * 0.6 + 0.005;

  const W = 800;
  const H = 480;

  const project = (lat: number, lng: number) => {
    const x = ((lng - (minLng - padLng)) / (maxLng + padLng - (minLng - padLng))) * W;
    const y = H - ((lat - (minLat - padLat)) / (maxLat + padLat - (minLat - padLat))) * H;
    return { x, y };
  };

  const polygonPoints = polygon
    .map((p) => {
      const proj = project(p.lat, p.lng);
      return `${proj.x},${proj.y}`;
    })
    .join(" ");
  const c = project(center.lat, center.lng);

  const color =
    status === "active"
      ? "#2ef191"
      : status === "warning"
        ? "#ffb454"
        : status === "invalidated"
          ? "#ff6c6c"
          : status === "regenerating"
            ? "#3eb3ff"
            : "#ffffff";

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-bg-line bg-bg-card">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full">
        <defs>
          <pattern id="terrain" width="22" height="22" patternUnits="userSpaceOnUse">
            <rect width="22" height="22" fill="#0a1117" />
            <circle cx="6" cy="6" r="1" fill="rgba(46,241,145,0.15)" />
            <circle cx="14" cy="14" r="1" fill="rgba(46,241,145,0.08)" />
            <circle cx="18" cy="3" r="0.8" fill="rgba(62,179,255,0.15)" />
          </pattern>
          <radialGradient id="vignette" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="rgba(46,241,145,0.06)" />
            <stop offset="80%" stopColor="rgba(0,0,0,0.4)" />
          </radialGradient>
          <linearGradient id="polyFill" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.08" />
          </linearGradient>
        </defs>

        <rect width={W} height={H} fill="url(#terrain)" />
        <rect width={W} height={H} fill="url(#vignette)" />

        {/* Pseudo "satellite" topo lines */}
        <g
          stroke="rgba(46,241,145,0.08)"
          strokeWidth="0.7"
          fill="none"
        >
          {Array.from({ length: 16 }).map((_, i) => (
            <path
              key={i}
              d={`M0 ${i * 32 + 12} Q${W / 2} ${i * 32 + (i % 2 === 0 ? -10 : 30)} ${W} ${i * 32 + 12}`}
            />
          ))}
        </g>

        {/* Parcel polygon */}
        <polygon
          points={polygonPoints}
          fill="url(#polyFill)"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Center marker */}
        <g transform={`translate(${c.x}, ${c.y})`}>
          <circle r="14" fill={color} opacity="0.18">
            <animate attributeName="r" values="10;22;10" dur="2.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.25;0;0.25" dur="2.6s" repeatCount="indefinite" />
          </circle>
          <circle r="6" fill={color} />
          <circle r="2.5" fill="#05090c" />
        </g>

        {/* Coordinate readout */}
        <g
          fontFamily="ui-monospace, SFMono-Regular, monospace"
          fontSize="11"
          fill="rgba(255,255,255,0.55)"
        >
          <text x={12} y={20}>
            LAT {center.lat.toFixed(5)}°
          </text>
          <text x={12} y={36}>
            LNG {center.lng.toFixed(5)}°
          </text>
          <text x={W - 130} y={H - 14}>
            {parcel.hectares.toLocaleString()} ha
          </text>
        </g>
      </svg>
      {/* Scan line overlay for satellite effect */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 -top-8 h-12 animate-scan bg-gradient-to-b from-transparent via-eco-400/15 to-transparent" />
      </div>
    </div>
  );
}
