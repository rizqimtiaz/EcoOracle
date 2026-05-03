"use client";

import {
  Line,
  LineChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SatelliteScanReport } from "@/lib/types";

interface Props {
  scans: SatelliteScanReport[];
}

export function ScanTimelineChart({ scans }: Props) {
  const data = scans
    .slice()
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((s) => ({
      date: new Date(s.timestamp).toISOString().slice(5, 10),
      ndvi: Number((s.ndvi * 100).toFixed(2)),
      canopy: Number((s.canopyDensity * 100).toFixed(2)),
      biomass: Number((s.biomassIndex * 100).toFixed(2)),
      moisture: Number((s.moistureIndex * 100).toFixed(2)),
      thermal: Number((s.thermalAnomaly * 100).toFixed(2)),
    }));
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 12, left: -8, bottom: 0 }}>
          <CartesianGrid stroke="#1b2a36" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
          />
          <YAxis
            tickFormatter={(v) => `${v}%`}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              background: "#0e161e",
              border: "1px solid #1b2a36",
              borderRadius: 10,
              fontSize: 12,
            }}
            labelStyle={{ color: "rgba(255,255,255,0.7)" }}
            formatter={(v: number, name) => [`${v}%`, name]}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}
          />
          <Line type="monotone" dataKey="ndvi" stroke="#2ef191" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="canopy" stroke="#3eb3ff" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="biomass" stroke="#a4ffd0" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="moisture" stroke="#0c92ff" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="thermal" stroke="#ff6c6c" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
