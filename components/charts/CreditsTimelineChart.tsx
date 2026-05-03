"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SatelliteScanReport } from "@/lib/types";

export function CreditsTimelineChart({ scans }: { scans: SatelliteScanReport[] }) {
  const data = scans
    .slice()
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((s) => ({
      date: new Date(s.timestamp).toISOString().slice(5, 10),
      tonnesCO2: Math.round(s.estimatedTonnesCO2),
    }));
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 12, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="parcelFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2ef191" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#2ef191" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1b2a36" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
            width={50}
            tickFormatter={(v) =>
              v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
            }
          />
          <Tooltip
            contentStyle={{
              background: "#0e161e",
              border: "1px solid #1b2a36",
              borderRadius: 10,
              fontSize: 12,
            }}
            labelStyle={{ color: "rgba(255,255,255,0.7)" }}
            formatter={(v: number) => [`${v.toLocaleString()} t`, "Verified CO₂e"]}
          />
          <Area
            type="monotone"
            dataKey="tonnesCO2"
            stroke="#2ef191"
            strokeWidth={1.6}
            fill="url(#parcelFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
