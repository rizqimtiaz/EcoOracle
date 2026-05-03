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

interface Datum {
  date: string;
  tonnesCO2: number;
}

export function NetworkAreaChart({ data }: { data: Datum[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, left: -12, right: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="ecoFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2ef191" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#2ef191" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1b2a36" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
            interval={4}
          />
          <YAxis
            tickFormatter={(v) =>
              v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}Mt` : v >= 1000 ? `${(v / 1000).toFixed(0)}kt` : `${v}t`
            }
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
            width={60}
          />
          <Tooltip
            contentStyle={{
              background: "#0e161e",
              border: "1px solid #1b2a36",
              borderRadius: 10,
              fontSize: 12,
            }}
            labelStyle={{ color: "rgba(255,255,255,0.7)" }}
            formatter={(v: number) => [`${v.toLocaleString()} t CO₂e`, "Verified"]}
          />
          <Area
            type="monotone"
            dataKey="tonnesCO2"
            stroke="#2ef191"
            strokeWidth={1.6}
            fill="url(#ecoFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
